import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationQueueProcessor } from '../notification-queue.processor';
import { NotificationService } from '../notification.service';
import { Job } from 'bullmq';

describe('NotificationQueueProcessor', () => {
  let processor: NotificationQueueProcessor;
  let mockNotificationService: {
    send: ReturnType<typeof vi.fn>;
    sendBulk: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockNotificationService = {
      send: vi.fn().mockResolvedValue({ success: true, channels: { line: { sent: true } } }),
      sendBulk: vi.fn().mockResolvedValue({ sent: 3, failed: 0 }),
    };

    processor = new NotificationQueueProcessor(
      mockNotificationService as unknown as NotificationService,
    );
  });

  describe('process - send job', () => {
    it('should call notificationService.send with job data', async () => {
      const jobData = {
        userId: 'user-1',
        templateKey: 'vaccine_reminder',
        variables: { animalName: 'Buddy' },
        channels: ['line' as const],
      };

      const job = { id: 'job-1', name: 'send', data: jobData } as unknown as Job;

      const result = await processor.process(job);

      expect(mockNotificationService.send).toHaveBeenCalledWith(jobData);
      expect(result).toEqual({ success: true, channels: { line: { sent: true } } });
    });

    it('should throw when notification delivery fails on all channels', async () => {
      mockNotificationService.send.mockResolvedValue({
        success: false,
        channels: { line: { sent: false, error: 'timeout' } },
      });

      const job = {
        id: 'job-2',
        name: 'send',
        data: { userId: 'user-1', templateKey: 'test', variables: {} },
      } as unknown as Job;

      await expect(processor.process(job)).rejects.toThrow(
        'Notification delivery failed on all channels',
      );
    });
  });

  describe('process - sendBulk job', () => {
    it('should call notificationService.sendBulk with correct parameters', async () => {
      const jobData = {
        userIds: ['user-1', 'user-2', 'user-3'],
        templateKey: 'campaign_announcement',
        variables: { campaignName: 'TNR' },
        options: { priority: 'normal' as const },
      };

      const job = { id: 'job-3', name: 'sendBulk', data: jobData } as unknown as Job;

      const result = await processor.process(job);

      expect(mockNotificationService.sendBulk).toHaveBeenCalledWith(
        jobData.userIds,
        jobData.templateKey,
        jobData.variables,
        jobData.options,
      );
      expect(result).toEqual({ sent: 3, failed: 0 });
    });

    it('should throw when majority of bulk sends fail', async () => {
      mockNotificationService.sendBulk.mockResolvedValue({ sent: 1, failed: 4 });

      const jobData = {
        userIds: ['u1', 'u2', 'u3', 'u4', 'u5'],
        templateKey: 'test',
        variables: {},
      };

      const job = { id: 'job-4', name: 'sendBulk', data: jobData } as unknown as Job;

      await expect(processor.process(job)).rejects.toThrow(
        'Bulk notification mostly failed: 4/5 users',
      );
    });

    it('should succeed when fewer or equal failures than successes', async () => {
      mockNotificationService.sendBulk.mockResolvedValue({ sent: 3, failed: 2 });

      const jobData = {
        userIds: ['u1', 'u2', 'u3', 'u4', 'u5'],
        templateKey: 'test',
        variables: {},
      };

      const job = { id: 'job-5', name: 'sendBulk', data: jobData } as unknown as Job;

      const result = await processor.process(job);
      expect(result).toEqual({ sent: 3, failed: 2 });
    });
  });

  describe('process - unknown job type', () => {
    it('should return undefined for unknown job names', async () => {
      const job = { id: 'job-6', name: 'unknown', data: {} } as unknown as Job;

      const result = await processor.process(job);
      expect(result).toBeUndefined();
    });
  });
});
