import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ReportService } from '../report/report.service';
import { LineService, LineMessage } from '../../shared/services/line.service';

// LINE Webhook Event Types
export interface LineWebhookBody {
  destination: string;
  events: LineWebhookEvent[];
}

export interface LineWebhookEvent {
  type: string;
  message?: LineEventMessage;
  timestamp: number;
  source: LineEventSource;
  replyToken: string;
}

export interface LineEventSource {
  type: string;
  userId: string;
}

export type LineEventMessage =
  | LineTextEventMessage
  | LineLocationEventMessage
  | LineImageEventMessage;

export interface LineTextEventMessage {
  type: 'text';
  id: string;
  text: string;
}

export interface LineLocationEventMessage {
  type: 'location';
  id: string;
  title?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface LineImageEventMessage {
  type: 'image';
  id: string;
  contentProvider: {
    type: 'line' | 'external';
    originalContentUrl?: string;
  };
}

/** Keywords that indicate report intent */
const REPORT_KEYWORDS = [
  'แจ้ง',
  'พบสัตว์',
  'ช่วยด้วย',
  'สุนัขจรจัด',
  'แมมจรจัด',
  'หมาจรจัด',
  'สัตว์จรจัด',
  'หมาดุ',
  'แมวจรจัด',
  'บาดเจ็บ',
  'ถูกทำร้าย',
  'ฝูง',
];

@Injectable()
export class LineWebhookService {
  private readonly logger = new Logger(LineWebhookService.name);
  private readonly channelSecret: string;
  private readonly channelAccessToken: string;

  constructor(
    private readonly reportService: ReportService,
    private readonly lineService: LineService,
  ) {
    this.channelSecret = process.env.LINE_CHANNEL_SECRET || '';
    this.channelAccessToken = process.env.LINE_ACCESS_TOKEN || '';
  }

  /**
   * Validate LINE webhook signature using HMAC-SHA256
   */
  validateSignature(rawBody: string, signature: string): boolean {
    if (!this.channelSecret) {
      this.logger.warn('LINE_CHANNEL_SECRET is not configured');
      return false;
    }

    const hash = createHmac('sha256', this.channelSecret)
      .update(rawBody)
      .digest('base64');

    return hash === signature;
  }

  /**
   * Process all events from a webhook payload
   */
  async processEvents(body: LineWebhookBody): Promise<void> {
    for (const event of body.events) {
      try {
        await this.handleEvent(event);
      } catch (error) {
        this.logger.error(
          `Failed to process event from ${event.source?.userId}: ${(error as Error).message}`,
          (error as Error).stack,
        );
      }
    }
  }

  /**
   * Route event to appropriate handler
   */
  private async handleEvent(event: LineWebhookEvent): Promise<void> {
    if (event.type !== 'message' || !event.message) {
      this.logger.debug(`Ignoring non-message event: ${event.type}`);
      return;
    }

    const message = event.message;

    switch (message.type) {
      case 'text':
        await this.handleTextMessage(event, message as LineTextEventMessage);
        break;
      case 'location':
        await this.handleLocationMessage(event, message as LineLocationEventMessage);
        break;
      case 'image':
        await this.handleImageMessage(event, message as LineImageEventMessage);
        break;
      default:
        this.logger.debug(`Ignoring unsupported message type: ${(message as any).type}`);
    }
  }

  /**
   * Handle text messages — detect report intent and create report
   */
  private async handleTextMessage(
    event: LineWebhookEvent,
    message: LineTextEventMessage,
  ): Promise<void> {
    const text = message.text.trim();

    if (!this.hasReportIntent(text)) {
      await this.replyMessage(event.replyToken, [
        this.lineService.createTextMessage(
          'สวัสดีค่ะ 🐾 พิมพ์ "แจ้ง" ตามด้วยรายละเอียดเพื่อแจ้งพบสัตว์จรจัด หรือส่งพิกัดและรูปภาพมาได้เลยค่ะ',
        ),
      ]);
      return;
    }

    const reportType = this.detectReportType(text);

    const report = await this.reportService.create(
      {
        type: reportType,
        description: text,
        latitude: 13.7563, // Default Bangkok coords — will be updated with location message
        longitude: 100.5018,
        district: 'ไม่ระบุ',
      },
      undefined, // anonymous reporter via LINE
    );

    await this.replyMessage(event.replyToken, [
      this.lineService.createTextMessage(
        `✅ รับแจ้งเรียบร้อยค่ะ\n\n📋 หมายเลขติดตาม: ${report.trackingId}\n📝 รายละเอียด: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\n\nสามารถส่งรูปภาพหรือพิกัดเพิ่มเติมได้ค่ะ\nพิมพ์ "ติดตาม ${report.trackingId}" เพื่อเช็คสถานะ`,
      ),
    ]);
  }

  /**
   * Handle location messages — create report with coordinates
   */
  private async handleLocationMessage(
    event: LineWebhookEvent,
    message: LineLocationEventMessage,
  ): Promise<void> {
    const report = await this.reportService.create(
      {
        type: 'NEW_SIGHTING',
        description: message.title || message.address || 'แจ้งพบสัตว์จรจัด (จากพิกัด)',
        latitude: message.latitude,
        longitude: message.longitude,
        district: message.address || 'ไม่ระบุ',
      },
      undefined,
    );

    await this.replyMessage(event.replyToken, [
      this.lineService.createTextMessage(
        `✅ รับแจ้งพิกัดเรียบร้อยค่ะ\n\n📋 หมายเลขติดตาม: ${report.trackingId}\n📍 พิกัด: ${message.latitude.toFixed(4)}, ${message.longitude.toFixed(4)}\n\nสามารถส่งรูปภาพเพิ่มเติมได้ค่ะ`,
      ),
    ]);
  }

  /**
   * Handle image messages — download and create report with photo
   */
  private async handleImageMessage(
    event: LineWebhookEvent,
    message: LineImageEventMessage,
  ): Promise<void> {
    const imageUrl = await this.downloadImageContent(message.id);

    const report = await this.reportService.create(
      {
        type: 'NEW_SIGHTING',
        description: 'แจ้งพบสัตว์จรจัด (จากรูปภาพ)',
        latitude: 13.7563,
        longitude: 100.5018,
        district: 'ไม่ระบุ',
        photoUrls: imageUrl ? [imageUrl] : [],
      },
      undefined,
    );

    await this.replyMessage(event.replyToken, [
      this.lineService.createTextMessage(
        `✅ รับรูปภาพเรียบร้อยค่ะ\n\n📋 หมายเลขติดตาม: ${report.trackingId}\n📷 แนบรูปภาพ 1 รูป\n\nส่งพิกัดเพิ่มเติมเพื่อระบุตำแหน่งได้ค่ะ`,
      ),
    ]);
  }

  /**
   * Check if text contains report intent keywords
   */
  hasReportIntent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return REPORT_KEYWORDS.some((keyword) => lowerText.includes(keyword));
  }

  /**
   * Detect report type from text content
   */
  detectReportType(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('ทำร้าย') || lowerText.includes('ถูกทำร้าย')) {
      return 'ABUSE';
    }
    if (lowerText.includes('บาดเจ็บ') || lowerText.includes('เจ็บ') || lowerText.includes('ป่วย')) {
      return 'INJURED';
    }
    if (lowerText.includes('ดุ') || lowerText.includes('กัด') || lowerText.includes('อันตราย')) {
      return 'AGGRESSIVE';
    }
    if (lowerText.includes('ฝูง') || lowerText.includes('หลายตัว')) {
      return 'GROWING_PACK';
    }

    return 'NEW_SIGHTING';
  }

  /**
   * Download image content from LINE servers
   * Returns the stored URL or null if download fails
   */
  private async downloadImageContent(messageId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        },
      );

      if (!response.ok) {
        this.logger.error(`Failed to download LINE image: ${response.status}`);
        return null;
      }

      // TODO: Store the image in S3 and return CDN URL
      // For now, return a reference URL
      const cdnUrl = process.env.AWS_CLOUDFRONT_URL || 'https://cdn.stray-animal.example.com';
      const key = `line-images/${messageId}.jpg`;
      return `${cdnUrl}/${key}`;
    } catch (error) {
      this.logger.error(`Error downloading LINE image: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Reply to a LINE message using the reply token
   */
  private async replyMessage(replyToken: string, messages: LineMessage[]): Promise<void> {
    try {
      const response = await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({ replyToken, messages }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`LINE reply failed: ${errorBody}`);
      }
    } catch (error) {
      this.logger.error(`Error replying to LINE: ${(error as Error).message}`);
    }
  }
}
