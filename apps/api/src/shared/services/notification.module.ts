import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { LineService } from './line.service';
import { EmailService } from './email.service';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationQueueProcessor } from './notification-queue.processor';
import { PrismaService } from './prisma.service';

/**
 * Global notification module — provides NotificationService to all modules.
 * This avoids the need for each feature module to import notification dependencies individually.
 *
 * Channels:
 * - LINE Push (via LineService) — requires LINE_ACCESS_TOKEN env var
 * - In-App (via Prisma/SQLite InAppNotification model)
 * - Email (via EmailService/Nodemailer) — requires SMTP_HOST env var, disabled by default
 *
 * Queue:
 * - BullMQ 'notifications' queue for reliable async delivery with retries
 * - NotificationQueueService for enqueuing jobs
 * - NotificationQueueProcessor for processing jobs
 */
@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  controllers: [NotificationController],
  providers: [
    PrismaService,
    NotificationService,
    LineService,
    EmailService,
    NotificationTemplatesService,
    NotificationQueueService,
    NotificationQueueProcessor,
  ],
  exports: [
    NotificationService,
    NotificationQueueService,
    LineService,
    EmailService,
    NotificationTemplatesService,
    PrismaService,
  ],
})
export class NotificationModule {}
