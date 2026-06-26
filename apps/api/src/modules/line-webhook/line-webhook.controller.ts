import {
  Controller,
  Post,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { LineWebhookService, LineWebhookBody } from './line-webhook.service';

@ApiTags('LINE Webhook')
@Controller('line/webhook')
export class LineWebhookController {
  private readonly logger = new Logger(LineWebhookController.name);

  constructor(private readonly webhookService: LineWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive LINE webhook events' })
  @ApiHeader({ name: 'x-line-signature', description: 'LINE webhook signature (HMAC-SHA256)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-line-signature') signature: string,
    @Body() body: LineWebhookBody,
  ): Promise<{ success: boolean }> {
    // Get raw body for signature validation
    const rawBody = req.rawBody?.toString('utf-8') || JSON.stringify(body);

    // Validate webhook signature
    if (!signature || !this.webhookService.validateSignature(rawBody, signature)) {
      this.logger.warn('Invalid LINE webhook signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`Received ${body.events?.length || 0} LINE webhook events`);

    // Process events asynchronously (respond 200 immediately)
    // LINE requires 200 response within 1 second
    this.webhookService.processEvents(body).catch((error) => {
      this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
    });

    return { success: true };
  }
}
