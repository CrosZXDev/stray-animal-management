import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationService, SendNotificationParams } from './notification.service';
import { BulkNotificationPayload } from './notification-queue.service';

/**
 * Processes notification jobs from the 'notifications' queue.
 * Delegates actual delivery to NotificationService.
 *
 * Job types:
 * - 'send': Single notification delivery
 * - 'sendBulk': Bulk notification delivery to multiple users
 */
@Processor('notifications')
export class NotificationQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<SendNotificationParams | BulkNotificationPayload>): Promise<unknown> {
    switch (job.name) {
      case 'send':
        return this.handleSend(job as Job<SendNotificationParams>);
      case 'sendBulk':
        return this.handleBulk(job as Job<BulkNotificationPayload>);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return undefined;
    }
  }

  private async handleSend(job: Job<SendNotificationParams>) {
    this.logger.debug(`Processing notification job ${job.id} for user ${job.data.userId}`);

    const result = await this.notificationService.send(job.data);

    if (!result.success) {
      this.logger.warn(`Notification job ${job.id} failed — no channel delivered`);
      throw new Error('Notification delivery failed on all channels');
    }

    this.logger.debug(`Notification job ${job.id} completed successfully`);
    return result;
  }

  private async handleBulk(job: Job<BulkNotificationPayload>) {
    const { userIds, templateKey, variables, options } = job.data;
    this.logger.debug(`Processing bulk notification job ${job.id} for ${userIds.length} users`);

    const result = await this.notificationService.sendBulk(userIds, templateKey, variables, options);

    this.logger.debug(`Bulk notification job ${job.id} completed: ${result.sent} sent, ${result.failed} failed`);

    // Fail the job if majority of sends failed
    if (result.failed > result.sent) {
      throw new Error(`Bulk notification mostly failed: ${result.failed}/${userIds.length} users`);
    }

    return result;
  }
}
