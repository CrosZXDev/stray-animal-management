import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { LineWebhookService } from '../line-webhook.service';

describe('LineWebhookService', () => {
  let service: LineWebhookService;
  let mockReportService: any;
  let mockLineService: any;
  let fetchMock: ReturnType<typeof vi.fn>;

  const CHANNEL_SECRET = 'test-channel-secret';

  beforeEach(() => {
    process.env.LINE_CHANNEL_SECRET = CHANNEL_SECRET;
    process.env.LINE_ACCESS_TOKEN = 'test-access-token';
    process.env.AWS_CLOUDFRONT_URL = 'https://cdn.test.example.com';

    mockReportService = {
      create: vi.fn().mockResolvedValue({
        trackingId: 'RPT-20240101-0001',
        type: 'NEW_SIGHTING',
        description: 'test',
        status: 'RECEIVED',
      }),
    };

    mockLineService = {
      createTextMessage: vi.fn((text: string) => ({ type: 'text', text })),
    };

    fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => '' });
    global.fetch = fetchMock;

    service = new LineWebhookService(mockReportService, mockLineService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Signature Validation (HMAC-SHA256) ────────────────────────────────────

  describe('validateSignature', () => {
    it('should return true for a valid HMAC-SHA256 signature', () => {
      const body = '{"events":[]}';
      const expectedSignature = createHmac('sha256', CHANNEL_SECRET)
        .update(body)
        .digest('base64');

      expect(service.validateSignature(body, expectedSignature)).toBe(true);
    });

    it('should return false for an invalid signature', () => {
      const body = '{"events":[]}';
      expect(service.validateSignature(body, 'invalid-signature')).toBe(false);
    });

    it('should return false when channel secret is not configured', () => {
      process.env.LINE_CHANNEL_SECRET = '';
      const emptySecretService = new LineWebhookService(mockReportService, mockLineService);

      const body = '{"events":[]}';
      expect(emptySecretService.validateSignature(body, 'any-sig')).toBe(false);
    });

    it('should validate signature for body with Thai/unicode characters', () => {
      const body = '{"events":[{"text":"แจ้งพบสุนัขจรจัด"}]}';
      const expectedSignature = createHmac('sha256', CHANNEL_SECRET)
        .update(body)
        .digest('base64');

      expect(service.validateSignature(body, expectedSignature)).toBe(true);
    });

    it('should reject signature when body is modified after signing', () => {
      const originalBody = '{"events":[]}';
      const signature = createHmac('sha256', CHANNEL_SECRET)
        .update(originalBody)
        .digest('base64');

      const tamperedBody = '{"events":[{"type":"hack"}]}';
      expect(service.validateSignature(tamperedBody, signature)).toBe(false);
    });

    it('should validate signature for empty events payload', () => {
      const body = '{"destination":"U123","events":[]}';
      const signature = createHmac('sha256', CHANNEL_SECRET)
        .update(body)
        .digest('base64');

      expect(service.validateSignature(body, signature)).toBe(true);
    });

    it('should reject an empty signature string', () => {
      const body = '{"events":[]}';
      expect(service.validateSignature(body, '')).toBe(false);
    });
  });

  // ─── Report Intent Detection ───────────────────────────────────────────────

  describe('hasReportIntent', () => {
    describe('should detect Thai report keywords', () => {
      const keywords = [
        { keyword: 'แจ้ง', text: 'แจ้งพบสุนัขจรจัด' },
        { keyword: 'พบสัตว์', text: 'พบสัตว์ข้างถนน' },
        { keyword: 'ช่วยด้วย', text: 'ช่วยด้วย มีหมาดุ' },
        { keyword: 'สุนัขจรจัด', text: 'เจอสุนัขจรจัดหน้าบ้าน' },
        { keyword: 'แมวจรจัด', text: 'มีแมวจรจัดบาดเจ็บ' },
        { keyword: 'หมาจรจัด', text: 'หมาจรจัด 5 ตัว' },
        { keyword: 'สัตว์จรจัด', text: 'สัตว์จรจัดเยอะมาก' },
        { keyword: 'หมาดุ', text: 'หมาดุไล่กัดคน' },
        { keyword: 'บาดเจ็บ', text: 'สุนัขบาดเจ็บข้างถนน' },
        { keyword: 'ถูกทำร้าย', text: 'แมวถูกทำร้าย' },
        { keyword: 'ฝูง', text: 'ฝูงหมาจรจัดในซอย' },
      ];

      keywords.forEach(({ keyword, text }) => {
        it(`should detect "${keyword}"`, () => {
          expect(service.hasReportIntent(text)).toBe(true);
        });
      });
    });

    it('should return false for general greetings', () => {
      expect(service.hasReportIntent('สวัสดีครับ')).toBe(false);
    });

    it('should return false for empty text', () => {
      expect(service.hasReportIntent('')).toBe(false);
    });

    it('should return false for unrelated Thai text', () => {
      expect(service.hasReportIntent('วันนี้อากาศดีมาก')).toBe(false);
    });

    it('should return false for asking about menu/features', () => {
      expect(service.hasReportIntent('มีบริการอะไรบ้าง')).toBe(false);
    });

    it('should detect keyword in the middle of a sentence', () => {
      expect(service.hasReportIntent('เมื่อวานพบสัตว์ที่ซอยสุขุมวิท 23')).toBe(true);
    });
  });

  // ─── Report Type Classification ───────────────────────────────────────────

  describe('detectReportType', () => {
    it('should classify text with "ทำร้าย" as ABUSE', () => {
      expect(service.detectReportType('คนทำร้ายสัตว์')).toBe('ABUSE');
    });

    it('should classify text with "ถูกทำร้าย" as ABUSE', () => {
      expect(service.detectReportType('แมวถูกทำร้ายสาหัส')).toBe('ABUSE');
    });

    it('should classify text with "บาดเจ็บ" as INJURED', () => {
      expect(service.detectReportType('สุนัขบาดเจ็บขาหัก')).toBe('INJURED');
    });

    it('should classify text with "เจ็บ" as INJURED', () => {
      expect(service.detectReportType('หมาเจ็บนอนอยู่ข้างทาง')).toBe('INJURED');
    });

    it('should classify text with "ป่วย" as INJURED', () => {
      expect(service.detectReportType('แมวป่วยหนัก')).toBe('INJURED');
    });

    it('should classify text with "ดุ" as AGGRESSIVE', () => {
      expect(service.detectReportType('หมาดุมากไล่กัดคน')).toBe('AGGRESSIVE');
    });

    it('should classify text with "กัด" as AGGRESSIVE', () => {
      expect(service.detectReportType('สุนัขกัดคน')).toBe('AGGRESSIVE');
    });

    it('should classify text with "อันตราย" as AGGRESSIVE', () => {
      expect(service.detectReportType('สัตว์อันตรายในซอย')).toBe('AGGRESSIVE');
    });

    it('should classify text with "ฝูง" as GROWING_PACK', () => {
      expect(service.detectReportType('ฝูงหมา 10 ตัว')).toBe('GROWING_PACK');
    });

    it('should classify text with "หลายตัว" as GROWING_PACK', () => {
      expect(service.detectReportType('สุนัขหลายตัวรวมกัน')).toBe('GROWING_PACK');
    });

    it('should default to NEW_SIGHTING for general reports', () => {
      expect(service.detectReportType('แจ้งพบสุนัขจรจัด')).toBe('NEW_SIGHTING');
    });

    it('should default to NEW_SIGHTING when no specific keywords match', () => {
      expect(service.detectReportType('พบสัตว์ข้างตลาด')).toBe('NEW_SIGHTING');
    });

    it('should prioritize ABUSE over INJURED when both keywords present', () => {
      // "ทำร้าย" check comes before "บาดเจ็บ" in the detection logic
      expect(service.detectReportType('สัตว์ถูกทำร้ายจนบาดเจ็บ')).toBe('ABUSE');
    });
  });

  // ─── Event Processing (text, location, image) ─────────────────────────────

  describe('processEvents', () => {
    describe('text messages', () => {
      it('should create a report for text message with report intent', async () => {
        const body = {
          destination: 'test',
          events: [
            {
              type: 'message',
              message: { type: 'text' as const, id: 'msg1', text: 'แจ้งพบสุนัขจรจัดหน้าตลาด' },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U123' },
              replyToken: 'reply-token-1',
            },
          ],
        };

        await service.processEvents(body);

        expect(mockReportService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'NEW_SIGHTING',
            description: 'แจ้งพบสุนัขจรจัดหน้าตลาด',
          }),
          undefined,
        );
      });

      it('should not create a report for non-report text', async () => {
        const body = {
          destination: 'test',
          events: [
            {
              type: 'message',
              message: { type: 'text' as const, id: 'msg3', text: 'สวัสดีครับ' },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U000' },
              replyToken: 'reply-token-4',
            },
          ],
        };

        await service.processEvents(body);

        expect(mockReportService.create).not.toHaveBeenCalled();
      });

      it('should send a help reply for non-report text', async () => {
        const body = {
          destination: 'test',
          events: [
            {
              type: 'message',
              message: { type: 'text' as const, id: 'msg-help', text: 'สวัสดี' },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U000' },
              replyToken: 'reply-token-help',
            },
          ],
        };

        await service.processEvents(body);

        // Should send a help message via reply API
        expect(fetchMock).toHaveBeenCalledWith(
          'https://api.line.me/v2/bot/message/reply',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('reply-token-help'),
          }),
        );
      });

      it('should detect correct report type from text and pass to report service', async () => {
        mockReportService.create.mockResolvedValue({
          trackingId: 'RPT-20240101-0002',
          type: 'AGGRESSIVE',
          description: 'test',
          status: 'RECEIVED',
        });

        const body = {
          destination: 'test',
          events: [
            {
              type: 'message',
              message: { type: 'text' as const, id: 'msg-aggr', text: 'แจ้งหมาดุกัดคนในซอย' },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U999' },
              replyToken: 'reply-aggr',
            },
          ],
        };

        await service.processEvents(body);

        expect(mockReportService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'AGGRESSIVE',
          }),
          undefined,
        );
      });
    });

    describe('location messages', () => {
      it('should create a report with exact coordinates from location message', async () => {
        const body = {
          destination: 'test',
          events: [
            {
              type: 'message',
              message: {
                type: 'location' as const,
                id: 'msg2',
                title: 'จุดพบสัตว์',
                address: 'ถนนสุขุมวิท วัฒนา',
                latitude: 13.7300,
                longitude: 100.5600,
              },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U456' },
              replyToken: 'reply-token-2',
            },
          ],
        };

        await service.processEvents(body);

        expect(mockReportService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'NEW_SIGHTING',
            latitude: 13.7300,
            longitude: 100.5600,
            district: 'ถนนสุขุมวิท วัฒนา',
          }),
          undefined,
        );
      });

      it('should use default description when title/address is missing', async () => {
        const body = {
          destination: 'test',
          events: [
            {
              type: 'message',
              message: {
                type: 'location' as const,
                id: 'loc-no-title',
                latitude: 13.8000,
                longitude: 100.6000,
              },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U456' },
              replyToken: 'reply-loc-no-title',
            },
          ],
        };

        await service.processEvents(body);

        expect(mockReportService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'แจ้งพบสัตว์จรจัด (จากพิกัด)',
          }),
          undefined,
        );
      });
    });

    describe('image messages', () => {
      it('should create a report with image URL for image message', async () => {
        const body = {
          destination: 'test',
          events: [
            {
              type: 'message',
              message: {
                type: 'image' as const,
                id: 'img-001',
                contentProvider: { type: 'line' as const },
              },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U789' },
              replyToken: 'reply-token-3',
            },
          ],
        };

        await service.processEvents(body);

        expect(mockReportService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'NEW_SIGHTING',
            description: 'แจ้งพบสัตว์จรจัด (จากรูปภาพ)',
            photoUrls: ['https://cdn.test.example.com/line-images/img-001.jpg'],
          }),
          undefined,
        );
      });

      it('should handle image download failure gracefully', async () => {
        fetchMock.mockImplementation((url: string) => {
          if (url.includes('api-data.line.me')) {
            return Promise.resolve({ ok: false, status: 500, text: () => 'Internal Error' });
          }
          return Promise.resolve({ ok: true, text: () => '' });
        });

        const body = {
          destination: 'test',
          events: [
            {
              type: 'message',
              message: {
                type: 'image' as const,
                id: 'img-fail',
                contentProvider: { type: 'line' as const },
              },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U789' },
              replyToken: 'reply-img-fail',
            },
          ],
        };

        await service.processEvents(body);

        // Should still create report but with empty photoUrls
        expect(mockReportService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            photoUrls: [],
          }),
          undefined,
        );
      });
    });

    describe('non-message events', () => {
      it('should ignore follow events', async () => {
        const body = {
          destination: 'test',
          events: [
            {
              type: 'follow',
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U111' },
              replyToken: 'reply-token-5',
            },
          ],
        };

        await service.processEvents(body);

        expect(mockReportService.create).not.toHaveBeenCalled();
      });

      it('should ignore unfollow events', async () => {
        const body = {
          destination: 'test',
          events: [
            {
              type: 'unfollow',
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U222' },
              replyToken: '',
            },
          ],
        };

        await service.processEvents(body);

        expect(mockReportService.create).not.toHaveBeenCalled();
      });

      it('should handle empty events array', async () => {
        const body = {
          destination: 'test',
          events: [],
        };

        await service.processEvents(body);

        expect(mockReportService.create).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should continue processing remaining events when one fails', async () => {
        mockReportService.create
          .mockRejectedValueOnce(new Error('DB connection lost'))
          .mockResolvedValueOnce({
            trackingId: 'RPT-20240101-0003',
            type: 'NEW_SIGHTING',
            description: 'test',
            status: 'RECEIVED',
          });

        const body = {
          destination: 'test',
          events: [
            {
              type: 'message',
              message: { type: 'text' as const, id: 'fail-msg', text: 'แจ้งพบสุนัข' },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U-fail' },
              replyToken: 'reply-fail',
            },
            {
              type: 'message',
              message: { type: 'text' as const, id: 'ok-msg', text: 'แจ้งพบแมว' },
              timestamp: Date.now(),
              source: { type: 'user', userId: 'U-ok' },
              replyToken: 'reply-ok',
            },
          ],
        };

        // Should not throw — errors are caught per-event
        await expect(service.processEvents(body)).resolves.not.toThrow();
        expect(mockReportService.create).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ─── Message Formatting ────────────────────────────────────────────────────

  describe('reply message formatting', () => {
    it('should include tracking ID in the reply message for text reports', async () => {
      mockReportService.create.mockResolvedValue({
        trackingId: 'RPT-20240315-0042',
        type: 'NEW_SIGHTING',
        description: 'test',
        status: 'RECEIVED',
      });

      const body = {
        destination: 'test',
        events: [
          {
            type: 'message',
            message: { type: 'text' as const, id: 'fmt1', text: 'แจ้งพบสุนัขจรจัด' },
            timestamp: Date.now(),
            source: { type: 'user', userId: 'Ufmt' },
            replyToken: 'reply-fmt1',
          },
        ],
      };

      await service.processEvents(body);

      // Verify the reply includes the tracking ID
      const replyCall = fetchMock.mock.calls.find(
        (call: any[]) => call[0] === 'https://api.line.me/v2/bot/message/reply',
      );
      expect(replyCall).toBeDefined();

      const replyBody = JSON.parse(replyCall![1].body);
      expect(replyBody.replyToken).toBe('reply-fmt1');
      expect(replyBody.messages[0].text).toContain('RPT-20240315-0042');
    });

    it('should include Thai confirmation message (✅ รับแจ้งเรียบร้อย) for report', async () => {
      mockReportService.create.mockResolvedValue({
        trackingId: 'RPT-20240315-0001',
        type: 'NEW_SIGHTING',
        description: 'test',
        status: 'RECEIVED',
      });

      const body = {
        destination: 'test',
        events: [
          {
            type: 'message',
            message: { type: 'text' as const, id: 'thai1', text: 'แจ้งพบสุนัข' },
            timestamp: Date.now(),
            source: { type: 'user', userId: 'Uthai' },
            replyToken: 'reply-thai',
          },
        ],
      };

      await service.processEvents(body);

      const replyCall = fetchMock.mock.calls.find(
        (call: any[]) => call[0] === 'https://api.line.me/v2/bot/message/reply',
      );
      const replyBody = JSON.parse(replyCall![1].body);
      expect(replyBody.messages[0].text).toContain('✅');
      expect(replyBody.messages[0].text).toContain('รับแจ้งเรียบร้อย');
    });

    it('should include tracking ID in location report reply', async () => {
      mockReportService.create.mockResolvedValue({
        trackingId: 'RPT-20240315-0099',
        type: 'NEW_SIGHTING',
        description: 'test',
        status: 'RECEIVED',
      });

      const body = {
        destination: 'test',
        events: [
          {
            type: 'message',
            message: {
              type: 'location' as const,
              id: 'loc-fmt',
              latitude: 13.75,
              longitude: 100.50,
              address: 'บางนา',
            },
            timestamp: Date.now(),
            source: { type: 'user', userId: 'Uloc' },
            replyToken: 'reply-loc-fmt',
          },
        ],
      };

      await service.processEvents(body);

      const replyCall = fetchMock.mock.calls.find(
        (call: any[]) => call[0] === 'https://api.line.me/v2/bot/message/reply',
      );
      const replyBody = JSON.parse(replyCall![1].body);
      expect(replyBody.messages[0].text).toContain('RPT-20240315-0099');
      expect(replyBody.messages[0].text).toContain('พิกัด');
    });

    it('should include tracking ID in image report reply', async () => {
      mockReportService.create.mockResolvedValue({
        trackingId: 'RPT-20240315-0050',
        type: 'NEW_SIGHTING',
        description: 'test',
        status: 'RECEIVED',
      });

      const body = {
        destination: 'test',
        events: [
          {
            type: 'message',
            message: {
              type: 'image' as const,
              id: 'img-fmt',
              contentProvider: { type: 'line' as const },
            },
            timestamp: Date.now(),
            source: { type: 'user', userId: 'Uimg' },
            replyToken: 'reply-img-fmt',
          },
        ],
      };

      await service.processEvents(body);

      const replyCall = fetchMock.mock.calls.find(
        (call: any[]) => call[0] === 'https://api.line.me/v2/bot/message/reply',
      );
      const replyBody = JSON.parse(replyCall![1].body);
      expect(replyBody.messages[0].text).toContain('RPT-20240315-0050');
      expect(replyBody.messages[0].text).toContain('รูปภาพ');
    });

    it('should truncate long descriptions in reply message', async () => {
      const longDescription = 'แจ้ง' + 'ก'.repeat(100);
      mockReportService.create.mockResolvedValue({
        trackingId: 'RPT-20240315-0010',
        type: 'NEW_SIGHTING',
        description: longDescription,
        status: 'RECEIVED',
      });

      const body = {
        destination: 'test',
        events: [
          {
            type: 'message',
            message: { type: 'text' as const, id: 'long-msg', text: longDescription },
            timestamp: Date.now(),
            source: { type: 'user', userId: 'Ulong' },
            replyToken: 'reply-long',
          },
        ],
      };

      await service.processEvents(body);

      const replyCall = fetchMock.mock.calls.find(
        (call: any[]) => call[0] === 'https://api.line.me/v2/bot/message/reply',
      );
      const replyBody = JSON.parse(replyCall![1].body);
      // Should truncate and add "..." for text > 50 chars
      expect(replyBody.messages[0].text).toContain('...');
    });

    it('should reply with help instructions via LINE Messaging API', async () => {
      const body = {
        destination: 'test',
        events: [
          {
            type: 'message',
            message: { type: 'text' as const, id: 'greeting', text: 'สวัสดีค่ะ' },
            timestamp: Date.now(),
            source: { type: 'user', userId: 'Uhelp' },
            replyToken: 'reply-help-msg',
          },
        ],
      };

      await service.processEvents(body);

      const replyCall = fetchMock.mock.calls.find(
        (call: any[]) => call[0] === 'https://api.line.me/v2/bot/message/reply',
      );
      expect(replyCall).toBeDefined();

      const replyBody = JSON.parse(replyCall![1].body);
      expect(replyBody.replyToken).toBe('reply-help-msg');
      // Help message should contain guidance in Thai
      expect(replyBody.messages[0].text).toContain('แจ้ง');
    });

    it('should use correct Authorization header when calling reply API', async () => {
      const body = {
        destination: 'test',
        events: [
          {
            type: 'message',
            message: { type: 'text' as const, id: 'auth-check', text: 'แจ้งพบหมา' },
            timestamp: Date.now(),
            source: { type: 'user', userId: 'Uauth' },
            replyToken: 'reply-auth',
          },
        ],
      };

      await service.processEvents(body);

      const replyCall = fetchMock.mock.calls.find(
        (call: any[]) => call[0] === 'https://api.line.me/v2/bot/message/reply',
      );
      expect(replyCall![1].headers.Authorization).toBe('Bearer test-access-token');
    });
  });
});
