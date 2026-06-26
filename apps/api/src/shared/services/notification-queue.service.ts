import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SendNotificationParams, NotificationChannel, NotificationPriority } from './notification.service';
import { TemplateVariables } from './notification-templates.service';

/**
 * Options for bulk notification delivery
 */
export interface BulkNotificationOptions {
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
}

/**
 * Payload for bulk notification jobs
 */
export interface BulkNotificationPayload {
  userIds: string[];
  templateKey: string;
  variables: TemplateVariables;
  options?: BulkNotificationOptions;
}

/**
 * Queue-based notification service that adds notification jobs to a Bull queue
 * for reliable, asynchronous delivery with automatic retries.
 *
 * Use this instead of NotificationService.send() for non-critical notifications
 * where immediate delivery is not required.
 */
@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(@InjectQueue('notifications') private readonly notificationQueue: Queue) {}

  /**
   * Add a notification job to the queue for async delivery.
   * Returns the job ID for tracking.
   *
   * Retry policy: 3 attempts with exponential backoff (1s, 2s, 4s)
   */
  async enqueue(params: SendNotificationParams): Promise<string> {
    const job = await this.notificationQueue.add('send', params, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    this.logger.debug(`Notification job enqueued: ${job.id} for user ${params.userId}`);
    return job.id as string;
  }

  /**
   * Add a bulk notification job to the queue.
   * All users receive the same message template with the same variables.
   *
   * Retry policy: 3 attempts with exponential backoff (2s, 4s, 8s)
   */
  async enqueueBulk(
    userIds: string[],
    templateKey: string,
    variables: TemplateVariables,
    options?: BulkNotificationOptions,
  ): Promise<string> {
    const payload: BulkNotificationPayload = { userIds, templateKey, variables, options };

    const job = await this.notificationQueue.add('sendBulk', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    this.logger.debug(`Bulk notification job enqueued: ${job.id} for ${userIds.length} users`);
    return job.id as string;
  }
}
