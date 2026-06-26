import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { LineService, LineFlexContainer, LineMessage } from '../line.service';

describe('LINE Push Notifications', () => {
  let lineService: LineService;

  beforeEach(() => {
    process.env.LINE_CHANNEL_ID = 'test-channel-id';
    process.env.LINE_CHANNEL_SECRET = 'test-channel-secret';
    process.env.LINE_ACCESS_TOKEN = 'test-channel-access-token';
    process.env.APP_URL = 'http://localhost:3001';

    lineService = new LineService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('pushMessage', () => {
    it('should push a text message to a single user', async () => {
      const mockResponse = { sentMessages: [{ id: 'msg-123', quoteToken: 'qt-456' }] };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const messages: LineMessage[] = [{ type: 'text', text: 'Hello!' }];
      const result = await lineService.pushMessage('U1234567890abcdef', messages);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-channel-access-token',
          },
          body: JSON.stringify({
            to: 'U1234567890abcdef',
            messages: [{ type: 'text', text: 'Hello!' }],
          }),
        },
      );
    });

    it('should throw BadRequestException when userId is empty', async () => {
      const messages: LineMessage[] = [{ type: 'text', text: 'Hello!' }];

      await expect(lineService.pushMessage('', messages)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when messages array is empty', async () => {
      await expect(
        lineService.pushMessage('U1234567890abcdef', []),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when messages exceed 5', async () => {
      const messages: LineMessage[] = Array.from({ length: 6 }, (_, i) => ({
        type: 'text' as const,
        text: `Message ${i}`,
      }));

      await expect(
        lineService.pushMessage('U1234567890abcdef', messages),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('{"message":"Invalid reply token"}'),
      });

      const messages: LineMessage[] = [{ type: 'text', text: 'Hello!' }];

      await expect(
        lineService.pushMessage('U1234567890abcdef', messages),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should support flex messages', async () => {
      const mockResponse = { sentMessages: [{ id: 'msg-456' }] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const flexContents: LineFlexContainer = {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{ type: 'text', text: 'Rich notification' }],
        },
      };

      const messages: LineMessage[] = [
        { type: 'flex', altText: 'Notification', contents: flexContents },
      ];

      const result = await lineService.pushMessage('U1234567890abcdef', messages);
      expect(result).toEqual(mockResponse);

      const callBody = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(callBody.messages[0].type).toBe('flex');
      expect(callBody.messages[0].altText).toBe('Notification');
      expect(callBody.messages[0].contents.type).toBe('bubble');
    });
  });

  describe('multicast', () => {
    it('should push messages to multiple users', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{}'),
      });

      const userIds = ['U001', 'U002', 'U003'];
      const messages: LineMessage[] = [{ type: 'text', text: 'Broadcast!' }];

      const result = await lineService.multicast(userIds, messages);
      expect(result).toEqual({});

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/multicast',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-channel-access-token',
          },
          body: JSON.stringify({
            to: ['U001', 'U002', 'U003'],
            messages: [{ type: 'text', text: 'Broadcast!' }],
          }),
        },
      );
    });

    it('should handle empty response body on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      });

      const result = await lineService.multicast(
        ['U001'],
        [{ type: 'text', text: 'Hi' }],
      );
      expect(result).toEqual({});
    });

    it('should throw BadRequestException when user list is empty', async () => {
      const messages: LineMessage[] = [{ type: 'text', text: 'Hello!' }];

      await expect(lineService.multicast([], messages)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user list exceeds 500', async () => {
      const userIds = Array.from({ length: 501 }, (_, i) => `U${i}`);
      const messages: LineMessage[] = [{ type: 'text', text: 'Hello!' }];

      await expect(lineService.multicast(userIds, messages)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when messages array is empty', async () => {
      await expect(lineService.multicast(['U001'], [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('{"message":"Rate limit exceeded"}'),
      });

      await expect(
        lineService.multicast(['U001'], [{ type: 'text', text: 'Hello' }]),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('message builders', () => {
    it('createTextMessage should return a valid text message', () => {
      const msg = lineService.createTextMessage('Hello world');
      expect(msg).toEqual({ type: 'text', text: 'Hello world' });
    });

    it('createFlexMessage should return a valid flex message', () => {
      const contents: LineFlexContainer = {
        type: 'bubble',
        body: { type: 'box', layout: 'vertical', contents: [] },
      };

      const msg = lineService.createFlexMessage('Alt text', contents);
      expect(msg).toEqual({
        type: 'flex',
        altText: 'Alt text',
        contents,
      });
    });
  });

  describe('convenience methods', () => {
    it('pushTextMessage should push a text message to a user', async () => {
      const mockResponse = { sentMessages: [{ id: 'msg-789' }] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await lineService.pushTextMessage('U001', 'Quick text');
      expect(result).toEqual(mockResponse);

      const callBody = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(callBody.to).toBe('U001');
      expect(callBody.messages).toEqual([{ type: 'text', text: 'Quick text' }]);
    });

    it('pushFlexMessage should push a flex message to a user', async () => {
      const mockResponse = { sentMessages: [{ id: 'msg-flex' }] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const contents: LineFlexContainer = {
        type: 'carousel',
        contents: [],
      };

      const result = await lineService.pushFlexMessage('U002', 'Flex alt', contents);
      expect(result).toEqual(mockResponse);

      const callBody = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(callBody.to).toBe('U002');
      expect(callBody.messages[0].type).toBe('flex');
      expect(callBody.messages[0].altText).toBe('Flex alt');
    });
  });
});
