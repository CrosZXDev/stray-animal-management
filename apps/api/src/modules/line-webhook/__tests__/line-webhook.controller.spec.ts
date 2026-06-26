import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { LineWebhookController } from '../line-webhook.controller';
import { LineWebhookService } from '../line-webhook.service';

describe('LineWebhookController', () => {
  let controller: LineWebhookController;
  let mockWebhookService: {
    validateSignature: ReturnType<typeof vi.fn>;
    processEvents: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockWebhookService = {
      validateSignature: vi.fn(),
      processEvents: vi.fn().mockResolvedValue(undefined),
    };

    controller = new LineWebhookController(
      mockWebhookService as unknown as LineWebhookService,
    );
  });

  // ─── Valid Requests ────────────────────────────────────────────────────────

  describe('valid webhook requests', () => {
    const validBody = {
      destination: 'test-dest',
      events: [
        {
          type: 'message',
          message: { type: 'text', id: 'msg1', text: 'แจ้งพบสุนัข' },
          timestamp: Date.now(),
          source: { type: 'user', userId: 'U123' },
          replyToken: 'token-1',
        },
      ],
    };

    it('should return { success: true } when signature is valid', async () => {
      mockWebhookService.validateSignature.mockReturnValue(true);

      const req = {
        rawBody: Buffer.from(JSON.stringify(validBody)),
      } as any;

      const result = await controller.handleWebhook(req, 'valid-sig', validBody);

      expect(result).toEqual({ success: true });
    });

    it('should call validateSignature with raw body string and signature', async () => {
      mockWebhookService.validateSignature.mockReturnValue(true);
      const bodyStr = JSON.stringify(validBody);

      const req = {
        rawBody: Buffer.from(bodyStr),
      } as any;

      await controller.handleWebhook(req, 'x-line-sig-abc', validBody);

      expect(mockWebhookService.validateSignature).toHaveBeenCalledWith(
        bodyStr,
        'x-line-sig-abc',
      );
    });

    it('should call processEvents with the body after validation', async () => {
      mockWebhookService.validateSignature.mockReturnValue(true);

      const req = {
        rawBody: Buffer.from(JSON.stringify(validBody)),
      } as any;

      await controller.handleWebhook(req, 'valid-sig', validBody);

      expect(mockWebhookService.processEvents).toHaveBeenCalledWith(validBody);
    });

    it('should return HTTP 200 response (success: true) for empty events', async () => {
      mockWebhookService.validateSignature.mockReturnValue(true);

      const emptyBody = { destination: 'test', events: [] };
      const req = {
        rawBody: Buffer.from(JSON.stringify(emptyBody)),
      } as any;

      const result = await controller.handleWebhook(req, 'valid-sig', emptyBody);

      expect(result).toEqual({ success: true });
    });

    it('should handle multiple events in a single webhook call', async () => {
      mockWebhookService.validateSignature.mockReturnValue(true);

      const multiEventBody = {
        destination: 'test',
        events: [
          {
            type: 'message',
            message: { type: 'text', id: 'msg1', text: 'แจ้งหมาดุ' },
            timestamp: Date.now(),
            source: { type: 'user', userId: 'U001' },
            replyToken: 'token-a',
          },
          {
            type: 'message',
            message: { type: 'location', id: 'loc1', latitude: 13.7, longitude: 100.5 },
            timestamp: Date.now(),
            source: { type: 'user', userId: 'U002' },
            replyToken: 'token-b',
          },
        ],
      };

      const req = {
        rawBody: Buffer.from(JSON.stringify(multiEventBody)),
      } as any;

      const result = await controller.handleWebhook(req, 'valid-sig', multiEventBody);

      expect(result).toEqual({ success: true });
      expect(mockWebhookService.processEvents).toHaveBeenCalledWith(multiEventBody);
    });

    it('should fall back to JSON.stringify(body) when rawBody is not available', async () => {
      mockWebhookService.validateSignature.mockReturnValue(true);

      const req = {
        rawBody: undefined,
      } as any;

      await controller.handleWebhook(req, 'valid-sig', validBody);

      // Should use JSON.stringify(body) as fallback
      expect(mockWebhookService.validateSignature).toHaveBeenCalledWith(
        JSON.stringify(validBody),
        'valid-sig',
      );
    });
  });

  // ─── Invalid Signature ─────────────────────────────────────────────────────

  describe('invalid signature handling', () => {
    const validBody = {
      destination: 'test-dest',
      events: [
        {
          type: 'message',
          message: { type: 'text', id: 'msg1', text: 'test' },
          timestamp: Date.now(),
          source: { type: 'user', userId: 'U123' },
          replyToken: 'token-1',
        },
      ],
    };

    it('should throw UnauthorizedException when signature is invalid', async () => {
      mockWebhookService.validateSignature.mockReturnValue(false);

      const req = {
        rawBody: Buffer.from(JSON.stringify(validBody)),
      } as any;

      await expect(
        controller.handleWebhook(req, 'invalid-sig', validBody),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when signature header is empty', async () => {
      const req = {
        rawBody: Buffer.from(JSON.stringify(validBody)),
      } as any;

      await expect(
        controller.handleWebhook(req, '', validBody),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when signature is undefined/null', async () => {
      mockWebhookService.validateSignature.mockReturnValue(false);

      const req = {
        rawBody: Buffer.from(JSON.stringify(validBody)),
      } as any;

      await expect(
        controller.handleWebhook(req, undefined as any, validBody),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should NOT call processEvents when signature is invalid', async () => {
      mockWebhookService.validateSignature.mockReturnValue(false);

      const req = {
        rawBody: Buffer.from(JSON.stringify(validBody)),
      } as any;

      try {
        await controller.handleWebhook(req, 'bad-sig', validBody);
      } catch {
        // Expected to throw
      }

      expect(mockWebhookService.processEvents).not.toHaveBeenCalled();
    });
  });

  // ─── Response Format ───────────────────────────────────────────────────────

  describe('response format', () => {
    it('should always respond with { success: true } on valid request', async () => {
      mockWebhookService.validateSignature.mockReturnValue(true);

      const body = { destination: 'dest', events: [] };
      const req = { rawBody: Buffer.from(JSON.stringify(body)) } as any;

      const result = await controller.handleWebhook(req, 'sig', body);

      expect(result).toHaveProperty('success', true);
      expect(Object.keys(result)).toEqual(['success']);
    });

    it('should respond quickly even if processEvents is slow (fire-and-forget)', async () => {
      mockWebhookService.validateSignature.mockReturnValue(true);
      // processEvents takes a long time but should not block the response
      mockWebhookService.processEvents.mockReturnValue(
        new Promise((resolve) => setTimeout(resolve, 5000)),
      );

      const body = {
        destination: 'dest',
        events: [
          {
            type: 'message',
            message: { type: 'text', id: 'x', text: 'แจ้ง' },
            timestamp: 0,
            source: { type: 'user', userId: 'U1' },
            replyToken: 'rt',
          },
        ],
      };
      const req = { rawBody: Buffer.from(JSON.stringify(body)) } as any;

      const result = await controller.handleWebhook(req, 'sig', body);

      // Should return immediately without waiting for processEvents
      expect(result).toEqual({ success: true });
    });
  });
});
