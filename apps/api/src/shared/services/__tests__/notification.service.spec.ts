import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService, SendNotificationParams } from '../notification.service';
import { LineService } from '../line.service';
import { EmailService } from '../email.service';
import { NotificationTemplatesService } from '../notification-templates.service';
import { PrismaService } from '../prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockPrisma: any;
  let mockLineService: Partial<LineService>;
  let mockEmailService: Partial<EmailService>;
  let mockTemplatesService: Partial<NotificationTemplatesService>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      inAppNotification: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
      },
      notificationPreference: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    mockLineService = {
      pushMessage: vi.fn().mockResolvedValue({ sentMessages: [{ id: 'msg-1' }] }),
    };

    mockEmailService = {
      isEnabled: vi.fn().mockReturnValue(true),
      sendNotificationEmail: vi.fn().mockResolvedValue({ sent: true, messageId: 'email-1' }),
    };

    mockTemplatesService = {
      render: vi.fn().mockReturnValue({ type: 'text', text: '✅ Test notification' }),
      hasTemplate: vi.fn().mockReturnValue(true),
    };

    service = new NotificationService(
      mockPrisma as unknown as PrismaService,
      mockLineService as LineService,
      mockEmailService as EmailService,
      mockTemplatesService as NotificationTemplatesService,
    );
  });

  describe('send', () => {
    it('should send notification to LINE and in-app when both channels specified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ lineUserId: 'U1234' });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        channels: ['line', 'in_app'],
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      expect(result.channels.line?.sent).toBe(true);
      expect(result.channels.in_app?.sent).toBe(true);
      expect(mockLineService.pushMessage).toHaveBeenCalledWith('U1234', [
        { type: 'text', text: '✅ Test notification' },
      ]);
    });

    it('should handle LINE failure gracefully and still send in-app', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ lineUserId: 'U1234' });
      (mockLineService.pushMessage as any).mockRejectedValue(new Error('LINE API error'));
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        channels: ['line', 'in_app'],
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      expect(result.channels.line?.sent).toBe(false);
      expect(result.channels.line?.error).toContain('LINE API error');
      expect(result.channels.in_app?.sent).toBe(true);
    });

    it('should skip LINE when user has no lineUserId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ lineUserId: null });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        channels: ['line', 'in_app'],
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      expect(result.channels.line?.sent).toBe(false);
      expect(result.channels.line?.error).toContain('no LINE account');
      expect(result.channels.in_app?.sent).toBe(true);
    });

    it('should return failure when template does not exist', async () => {
      (mockTemplatesService.hasTemplate as any).mockReturnValue(false);

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'nonexistent_template',
        variables: {},
        channels: ['in_app'],
      };

      const result = await service.send(params);

      expect(result.success).toBe(false);
    });

    it('should send email when email channel is enabled and user has email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'user@example.com' });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        channels: ['email', 'in_app'],
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      expect(result.channels.email?.sent).toBe(true);
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        '✅ Test notification',
        '✅ Test notification',
      );
    });

    it('should report email disabled when SMTP is not configured', async () => {
      (mockEmailService.isEnabled as any).mockReturnValue(false);
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        channels: ['email', 'in_app'],
      };

      const result = await service.send(params);

      expect(result.success).toBe(true); // in_app still succeeds
      expect(result.channels.email?.sent).toBe(false);
      expect(result.channels.email?.error).toContain('disabled');
    });

    it('should skip email when user has no email configured', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ email: null });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        channels: ['email', 'in_app'],
      };

      const result = await service.send(params);

      expect(result.success).toBe(true); // in_app still succeeds
      expect(result.channels.email?.sent).toBe(false);
      expect(result.channels.email?.error).toContain('no email');
    });

    it('should handle email send failure gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'user@example.com' });
      (mockEmailService.sendNotificationEmail as any).mockResolvedValue({
        sent: false,
        error: 'SMTP connection timeout',
      });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        channels: ['email', 'in_app'],
      };

      const result = await service.send(params);

      expect(result.success).toBe(true); // in_app still succeeds
      expect(result.channels.email?.sent).toBe(false);
      expect(result.channels.email?.error).toContain('SMTP connection timeout');
    });

    it('should use default channels when none specified', async () => {
      // Preferences: all enabled
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        id: 'pref-1',
        userId: 'user-1',
        lineEnabled: true,
        inAppEnabled: true,
        emailEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue({ lineUserId: 'U999', email: 'user@example.com' });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        // no channels specified
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      // Should have sent to in_app, line (since user has lineUserId), and email (since user has email and email is enabled)
      expect(result.channels.in_app?.sent).toBe(true);
      expect(result.channels.line?.sent).toBe(true);
      expect(result.channels.email?.sent).toBe(true);
    });

    it('should not include email in default channels when email service is disabled', async () => {
      (mockEmailService.isEnabled as any).mockReturnValue(false);
      // Preferences: all enabled but email service is disabled at infrastructure level
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        id: 'pref-1',
        userId: 'user-1',
        lineEnabled: true,
        inAppEnabled: true,
        emailEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue({ lineUserId: 'U999', email: 'user@example.com' });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        // no channels specified — relies on getDefaultChannels
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      expect(result.channels.in_app?.sent).toBe(true);
      expect(result.channels.line?.sent).toBe(true);
      // Email should not be attempted since service is disabled
      expect(result.channels.email).toBeUndefined();
    });
  });

  describe('getUnread', () => {
    it('should return unread notifications for user', async () => {
      const mockNotifications = [
        { id: '1', userId: 'user-1', title: 'Test', body: 'body', read: false, createdAt: new Date() },
      ];
      mockPrisma.inAppNotification.findMany.mockResolvedValue(mockNotifications);

      const result = await service.getUnread('user-1');

      expect(result).toEqual(mockNotifications);
      expect(mockPrisma.inAppNotification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      mockPrisma.inAppNotification.count.mockResolvedValue(7);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(7);
      expect(mockPrisma.inAppNotification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
      });
    });
  });

  describe('getAll', () => {
    it('should return paginated notifications', async () => {
      mockPrisma.inAppNotification.findMany.mockResolvedValue([]);
      mockPrisma.inAppNotification.count.mockResolvedValue(0);

      const result = await service.getAll('user-1', 2, 10);

      expect(result).toEqual({ items: [], total: 0, page: 2, limit: 10 });
      expect(mockPrisma.inAppNotification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a specific notification as read', async () => {
      mockPrisma.inAppNotification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('notif-1', 'user-1');

      expect(mockPrisma.inAppNotification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { read: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for a user', async () => {
      mockPrisma.inAppNotification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead('user-1');

      expect(mockPrisma.inAppNotification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true },
      });
    });
  });

  describe('sendBulk', () => {
    it('should send notification to multiple users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ lineUserId: null, email: null });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const result = await service.sendBulk(
        ['user-1', 'user-2', 'user-3'],
        'report_submitted',
        { trackingId: 'RPT-001', description: 'Test' },
        { channels: ['in_app'] },
      );

      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
    });
  });

  describe('getPreferences', () => {
    it('should return existing preferences for user', async () => {
      const existingPrefs = {
        id: 'pref-1',
        userId: 'user-1',
        lineEnabled: true,
        inAppEnabled: true,
        emailEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(existingPrefs);

      const result = await service.getPreferences('user-1');

      expect(result).toEqual(existingPrefs);
      expect(mockPrisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should create default preferences if none exist', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
      const defaultPrefs = {
        id: 'pref-new',
        userId: 'user-1',
        lineEnabled: true,
        inAppEnabled: true,
        emailEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.notificationPreference.create.mockResolvedValue(defaultPrefs);

      const result = await service.getPreferences('user-1');

      expect(result).toEqual(defaultPrefs);
      expect(mockPrisma.notificationPreference.create).toHaveBeenCalledWith({
        data: { userId: 'user-1' },
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update existing preferences', async () => {
      const existingPrefs = {
        id: 'pref-1',
        userId: 'user-1',
        lineEnabled: true,
        inAppEnabled: true,
        emailEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      };
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(existingPrefs);
      const updatedPrefs = { ...existingPrefs, emailEnabled: true, quietHoursStart: '22:00', quietHoursEnd: '07:00' };
      mockPrisma.notificationPreference.update.mockResolvedValue(updatedPrefs);

      const result = await service.updatePreferences('user-1', {
        emailEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      });

      expect(result).toEqual(updatedPrefs);
      expect(mockPrisma.notificationPreference.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { emailEnabled: true, quietHoursStart: '22:00', quietHoursEnd: '07:00' },
      });
    });

    it('should create preferences if none exist on update', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
      const createdPrefs = {
        id: 'pref-new',
        userId: 'user-1',
        lineEnabled: false,
        inAppEnabled: true,
        emailEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      };
      mockPrisma.notificationPreference.create.mockResolvedValue(createdPrefs);

      const result = await service.updatePreferences('user-1', { lineEnabled: false });

      expect(result).toEqual(createdPrefs);
      expect(mockPrisma.notificationPreference.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', lineEnabled: false },
      });
    });
  });

  describe('getDefaultChannels (preference-based)', () => {
    it('should only include in_app when line and email are disabled', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        id: 'pref-1',
        userId: 'user-1',
        lineEnabled: false,
        inAppEnabled: true,
        emailEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
        // no channels specified — relies on getDefaultChannels from preferences
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      expect(result.channels.in_app?.sent).toBe(true);
      expect(result.channels.line).toBeUndefined();
      expect(result.channels.email).toBeUndefined();
    });

    it('should create default preferences if none exist and use defaults', async () => {
      // First call: no preferences exist
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
      // Create returns defaults (lineEnabled=true, inAppEnabled=true, emailEnabled=false)
      mockPrisma.notificationPreference.create.mockResolvedValue({
        id: 'pref-new',
        userId: 'user-1',
        lineEnabled: true,
        inAppEnabled: true,
        emailEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue({ lineUserId: 'U123', email: 'user@example.com' });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      expect(result.channels.in_app?.sent).toBe(true);
      expect(result.channels.line?.sent).toBe(true);
      // email disabled by default
      expect(result.channels.email).toBeUndefined();
    });

    it('should respect LINE disabled preference even when user has LINE linked', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        id: 'pref-1',
        userId: 'user-1',
        lineEnabled: false,
        inAppEnabled: true,
        emailEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue({ lineUserId: 'U999', email: 'user@example.com' });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      expect(result.channels.in_app?.sent).toBe(true);
      expect(result.channels.line).toBeUndefined();
      expect(result.channels.email?.sent).toBe(true);
    });

    it('should only send in_app during quiet hours', async () => {
      // Set quiet hours to cover current time
      const now = new Date();
      const startHour = now.getHours() - 1;
      const endHour = now.getHours() + 1;
      const startStr = `${String(startHour < 0 ? startHour + 24 : startHour).padStart(2, '0')}:00`;
      const endStr = `${String(endHour > 23 ? endHour - 24 : endHour).padStart(2, '0')}:00`;

      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        id: 'pref-1',
        userId: 'user-1',
        lineEnabled: true,
        inAppEnabled: true,
        emailEnabled: true,
        quietHoursStart: startStr,
        quietHoursEnd: endStr,
      });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
      };

      const result = await service.send(params);

      expect(result.success).toBe(true);
      expect(result.channels.in_app?.sent).toBe(true);
      // LINE and email should not be sent during quiet hours
      expect(result.channels.line).toBeUndefined();
      expect(result.channels.email).toBeUndefined();
    });

    it('should ensure at least in_app when all channels are disabled', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        id: 'pref-1',
        userId: 'user-1',
        lineEnabled: false,
        inAppEnabled: false,
        emailEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      });
      mockPrisma.inAppNotification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        title: '✅ Test notification',
        body: '',
        read: false,
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const params: SendNotificationParams = {
        userId: 'user-1',
        templateKey: 'report_submitted',
        variables: { trackingId: 'RPT-001', description: 'Test' },
      };

      const result = await service.send(params);

      // Should fallback to in_app even when all are disabled
      expect(result.success).toBe(true);
      expect(result.channels.in_app?.sent).toBe(true);
    });
  });
});
