import { Injectable, Logger } from '@nestjs/common';
import { LineService } from './line.service';
import { EmailService } from './email.service';
import { NotificationTemplatesService, TemplateVariables } from './notification-templates.service';
import { PrismaService } from './prisma.service';

/**
 * Supported notification channels
 */
export type NotificationChannel = 'line' | 'in_app' | 'email';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high';

/**
 * Parameters for sending a notification
 */
export interface SendNotificationParams {
  /** Target user ID */
  userId: string;
  /** Template key from NotificationTemplatesService */
  templateKey: string;
  /** Variables for template interpolation */
  variables: TemplateVariables;
  /** Optional channel override (defaults to user preferences) */
  channels?: NotificationChannel[];
  /** Optional priority (defaults to 'normal') */
  priority?: NotificationPriority;
}

/**
 * Result of a notification send operation
 */
export interface NotificationResult {
  success: boolean;
  channels: {
    line?: { sent: boolean; error?: string };
    in_app?: { sent: boolean; notificationId?: string; error?: string };
    email?: { sent: boolean; error?: string };
  };
}

/**
 * Maps notification priority to stored priority string (SQLite-compatible)
 */
function toPrismaPriority(priority: NotificationPriority): string {
  switch (priority) {
    case 'low':
      return 'LOW';
    case 'high':
      return 'HIGH';
    case 'normal':
    default:
      return 'MEDIUM';
  }
}

/**
 * Central notification service that coordinates delivery across
 * multiple channels: LINE push, in-app (DB), and email (future).
 *
 * Routes notifications based on user preferences and specified channels.
 * Integrates with LineService for LINE push and NotificationTemplatesService
 * for Thai message formatting.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
    private readonly emailService: EmailService,
    private readonly templatesService: NotificationTemplatesService,
  ) {}

  /**
   * Send a notification to a user via specified or default channels.
   * Failures on individual channels are logged but don't block other channels.
   */
  async send(params: SendNotificationParams): Promise<NotificationResult> {
    const { userId, templateKey, variables, priority = 'normal' } = params;
    const channels = params.channels || (await this.getDefaultChannels(userId));

    const result: NotificationResult = { success: false, channels: {} };

    // Validate template exists
    if (!this.templatesService.hasTemplate(templateKey)) {
      this.logger.error(`Template not found: ${templateKey}`);
      return result;
    }

    // Render the message for LINE (text/flex)
    const lineMessage = this.templatesService.render(templateKey, variables);

    // Extract plain text for in-app notification
    const plainText = this.extractPlainText(lineMessage, templateKey, variables);

    // Send to each channel in parallel
    const promises: Promise<void>[] = [];

    if (channels.includes('line')) {
      promises.push(this.sendLine(userId, lineMessage, result));
    }

    if (channels.includes('in_app')) {
      promises.push(this.sendInApp(userId, plainText, priority, result));
    }

    if (channels.includes('email')) {
      promises.push(this.sendEmail(userId, plainText, result));
    }

    await Promise.allSettled(promises);

    // Mark success if at least one channel delivered
    result.success = Object.values(result.channels).some((ch) => ch?.sent === true);

    return result;
  }

  /**
   * Send notification to multiple users (same message)
   */
  async sendBulk(
    userIds: string[],
    templateKey: string,
    variables: TemplateVariables,
    options?: { channels?: NotificationChannel[]; priority?: NotificationPriority },
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      const result = await this.send({
        userId,
        templateKey,
        variables,
        channels: options?.channels,
        priority: options?.priority,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Get unread in-app notifications for a user
   */
  async getUnread(userId: string) {
    return this.prisma.inAppNotification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get the count of unread in-app notifications for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.inAppNotification.count({
      where: { userId, read: false },
    });
  }

  /**
   * Get all in-app notifications for a user (paginated)
   */
  async getAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.inAppNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inAppNotification.count({ where: { userId } }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  // ── Private Methods ──────────────────────────────────────────────────────

  private async sendLine(
    userId: string,
    lineMessage: ReturnType<NotificationTemplatesService['render']>,
    result: NotificationResult,
  ): Promise<void> {
    try {
      // Look up LINE userId from our user record
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { lineUserId: true },
      });

      if (!user?.lineUserId) {
        result.channels.line = { sent: false, error: 'User has no LINE account linked' };
        return;
      }

      await this.lineService.pushMessage(user.lineUserId, [lineMessage]);
      result.channels.line = { sent: true };
      this.logger.debug(`LINE push sent to user ${userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.channels.line = { sent: false, error: message };
      this.logger.error(`LINE push failed for user ${userId}: ${message}`);
    }
  }

  private async sendInApp(
    userId: string,
    plainText: { title: string; body: string },
    priority: NotificationPriority,
    result: NotificationResult,
  ): Promise<void> {
    try {
      const notification = await this.prisma.inAppNotification.create({
        data: {
          userId,
          title: plainText.title,
          body: plainText.body,
          priority: toPrismaPriority(priority),
        },
      });

      result.channels.in_app = { sent: true, notificationId: notification.id };
      this.logger.debug(`In-app notification stored for user ${userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.channels.in_app = { sent: false, error: message };
      this.logger.error(`In-app notification failed for user ${userId}: ${message}`);
    }
  }

  private async sendEmail(
    userId: string,
    plainText: { title: string; body: string },
    result: NotificationResult,
  ): Promise<void> {
    try {
      if (!this.emailService.isEnabled()) {
        result.channels.email = { sent: false, error: 'Email channel disabled' };
        return;
      }

      // Look up user's email address
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user?.email) {
        result.channels.email = { sent: false, error: 'User has no email configured' };
        return;
      }

      const emailResult = await this.emailService.sendNotificationEmail(
        user.email,
        plainText.title,
        plainText.body,
      );

      result.channels.email = { sent: emailResult.sent, error: emailResult.error };
      if (emailResult.sent) {
        this.logger.debug(`Email sent to user ${userId}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.channels.email = { sent: false, error: message };
      this.logger.error(`Email send failed for user ${userId}: ${message}`);
    }
  }

  /**
   * Get the notification preferences for a user.
   * If no preferences exist, creates default preferences and returns them.
   */
  async getPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences for a user.
   * Creates preferences if they don't exist yet, then applies the update.
   */
  async updatePreferences(userId: string, data: {
    lineEnabled?: boolean;
    inAppEnabled?: boolean;
    emailEnabled?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  }) {
    // Ensure preferences exist first
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!existing) {
      return this.prisma.notificationPreference.create({
        data: { userId, ...data },
      });
    }

    return this.prisma.notificationPreference.update({
      where: { userId },
      data,
    });
  }

  /**
   * Get default channels for a user based on their notification preferences.
   * Reads from the NotificationPreference table and checks channel availability.
   * Falls back to safe defaults if lookup fails.
   */
  private async getDefaultChannels(userId: string): Promise<NotificationChannel[]> {
    const channels: NotificationChannel[] = [];

    try {
      // Get or create user preferences
      let preferences = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!preferences) {
        preferences = await this.prisma.notificationPreference.create({
          data: { userId },
        });
      }

      // Check if currently in quiet hours
      if (this.isInQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd)) {
        // During quiet hours, only send in-app (silent)
        return ['in_app'];
      }

      // In-app channel
      if (preferences.inAppEnabled) {
        channels.push('in_app');
      }

      // LINE channel — only if enabled AND user has LINE linked
      if (preferences.lineEnabled) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { lineUserId: true, email: true },
        });

        if (user?.lineUserId) {
          channels.push('line');
        }

        // Email channel — only if enabled AND user has email AND email service is enabled
        if (preferences.emailEnabled && user?.email && this.emailService.isEnabled()) {
          channels.push('email');
        }
      } else {
        // Still check email even if LINE is disabled
        if (preferences.emailEnabled && this.emailService.isEnabled()) {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
          });

          if (user?.email) {
            channels.push('email');
          }
        }
      }

      // Ensure at least in_app is included if nothing else
      if (channels.length === 0) {
        channels.push('in_app');
      }
    } catch {
      // If lookup fails, just use in_app
      channels.push('in_app');
    }

    return channels;
  }

  /**
   * Check if the current time falls within the user's quiet hours.
   */
  private isInQuietHours(start: string | null, end: string | null): boolean {
    if (!start || !end) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    // Same-day quiet hours (e.g., 13:00 - 15:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /**
   * Extract a plain-text title + body from a LINE message for in-app storage
   */
  private extractPlainText(
    message: ReturnType<NotificationTemplatesService['render']>,
    templateKey: string,
    _variables: TemplateVariables,
  ): { title: string; body: string } {
    if (message.type === 'text') {
      const lines = message.text.split('\n');
      const title = lines[0] || templateKey;
      const body = lines.slice(1).join('\n').trim() || message.text;
      return { title, body };
    }

    // Flex message — use altText as body, derive title from template key
    const titleMap: Record<string, string> = {
      vaccine_reminder: '💉 แจ้งเตือนวัคซีน',
      adoption_approved: '🏠 อนุมัติการรับเลี้ยง',
      volunteer_assignment: '🙋 งานอาสาสมัคร',
      campaign_announcement: '📢 ประกาศกิจกรรม',
    };

    return {
      title: titleMap[templateKey] || templateKey,
      body: message.type === 'flex' ? message.altText : templateKey,
    };
  }
}
