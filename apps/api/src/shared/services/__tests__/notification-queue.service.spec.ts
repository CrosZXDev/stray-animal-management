import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationQueueService } from '../notification-queue.service';
import { SendNotificationParams } from '../notification.service';

describe('NotificationQueueService', () => {
  let service: NotificationQueueService;
  let mockQueue: { add: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockQueue = {
      add: vi.fn().mockResolvedValue({ id: 'job-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationQueueService,
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationQueueService>(NotificationQueueService);
  });

  describe('enqueue', () => {
    const params: SendNotificationParams = {
      userId: 'user-1',
      templateKey: 'vaccine_reminder',
      variables: { animalName: 'Buddy', date: '2024-01-15' },
      channels: ['line', 'in_app'],
      priority: 'high',
    };

    it('should add a job to the queue and return job ID', async () => {
      const jobId = await service.enqueue(params);

      expect(jobId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith('send', params, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      });
    });

    it('should use correct job name "send"', async () => {
      await service.enqueue(params);

      expect(mockQueue.add).toHaveBeenCalledWith('send', expect.anything(), expect.anything());
    });

    it('should configure 3 retry attempts with exponential backoff', async () => {
      await service.enqueue(params);

      const options = mockQueue.add.mock.calls[0][2];
      expect(options.attempts).toBe(3);
      expect(options.backoff).toEqual({ type: 'exponential', delay: 1000 });
    });

    it('should pass through notification params as job data', async () => {
      await service.enqueue(params);

      const data = mockQueue.add.mock.calls[0][1];
      expect(data).toEqual(params);
    });
  });

  describe('enqueueBulk', () => {
    const userIds = ['user-1', 'user-2', 'user-3'];
    const templateKey = 'campaign_announcement';
    const variables = { campaignName: 'TNR เขตบางกะปิ' };
    const options = { channels: ['line' as const, 'in_app' as const], priority: 'normal' as const };

    it('should add a bulk job to the queue and return job ID', async () => {
      const jobId = await service.enqueueBulk(userIds, templateKey, variables, options);

      expect(jobId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'sendBulk',
        { userIds, templateKey, variables, options },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      );
    });

    it('should use correct job name "sendBulk"', async () => {
      await service.enqueueBulk(userIds, templateKey, variables);

      expect(mockQueue.add).toHaveBeenCalledWith('sendBulk', expect.anything(), expect.anything());
    });

    it('should configure 2s initial backoff delay for bulk jobs', async () => {
      await service.enqueueBulk(userIds, templateKey, variables);

      const jobOptions = mockQueue.add.mock.calls[0][2];
      expect(jobOptions.backoff).toEqual({ type: 'exponential', delay: 2000 });
    });

    it('should include options as undefined when not provided', async () => {
      await service.enqueueBulk(userIds, templateKey, variables);

      const data = mockQueue.add.mock.calls[0][1];
      expect(data).toEqual({
        userIds,
        templateKey,
        variables,
        options: undefined,
      });
    });
  });
});
