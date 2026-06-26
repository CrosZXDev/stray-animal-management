import { Injectable, Logger } from '@nestjs/common';

/**
 * Email configuration loaded from environment variables.
 * Email is disabled by default unless SMTP_HOST is configured.
 */
export interface EmailConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromAddress: string;
  fromName: string;
}

/**
 * Parameters for sending an email
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Result of an email send attempt
 */
export interface EmailSendResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email notification channel service.
 *
 * Uses Nodemailer-compatible SMTP configuration via environment variables.
 * Disabled by default — only active when SMTP_HOST is set.
 *
 * Environment variables:
 *   SMTP_HOST — SMTP server hostname (required to enable email)
 *   SMTP_PORT — SMTP port (default: 587)
 *   SMTP_SECURE — Use TLS (default: false, set to "true" for port 465)
 *   SMTP_USER — SMTP auth username
 *   SMTP_PASS — SMTP auth password
 *   SMTP_FROM_ADDRESS — Sender email address
 *   SMTP_FROM_NAME — Sender display name
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly config: EmailConfig;
  private transporter: any = null;

  constructor() {
    this.config = {
      enabled: !!process.env.SMTP_HOST,
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromAddress: process.env.SMTP_FROM_ADDRESS || 'noreply@stray-animal.local',
      fromName: process.env.SMTP_FROM_NAME || 'ระบบจัดการสัตว์จรจัด',
    };

    if (this.config.enabled) {
      this.initializeTransporter();
    } else {
      this.logger.log('Email channel disabled (SMTP_HOST not configured)');
    }
  }

  /**
   * Check if the email channel is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Send an email notification.
   * Returns immediately with sent=false if email is disabled.
   */
  async sendEmail(params: SendEmailParams): Promise<EmailSendResult> {
    if (!this.config.enabled) {
      return { sent: false, error: 'Email channel disabled' };
    }

    if (!params.to) {
      return { sent: false, error: 'Recipient email address is required' };
    }

    try {
      const transporter = await this.getTransporter();

      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromAddress}>`,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html || undefined,
      };

      const info = await transporter.sendMail(mailOptions);

      this.logger.debug(`Email sent to ${params.to}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(`Email send failed to ${params.to}: ${message}`);
      return { sent: false, error: message };
    }
  }

  /**
   * Send a notification-style email with a standard template
   */
  async sendNotificationEmail(
    to: string,
    title: string,
    body: string,
  ): Promise<EmailSendResult> {
    const html = this.buildNotificationHtml(title, body);
    return this.sendEmail({
      to,
      subject: title,
      text: body,
      html,
    });
  }

  // ── Private Methods ──────────────────────────────────────────────────────

  private initializeTransporter(): void {
    try {
      // Dynamically require nodemailer to avoid hard dependency when disabled
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.user
          ? { user: this.config.user, pass: this.config.pass }
          : undefined,
      });
      this.logger.log(`Email channel initialized: ${this.config.host}:${this.config.port}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to initialize email transporter: ${message}`);
      this.config.enabled = false;
    }
  }

  private async getTransporter(): Promise<any> {
    if (!this.transporter) {
      this.initializeTransporter();
    }
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }
    return this.transporter;
  }

  /**
   * Build a simple HTML notification email.
   * Uses inline styles for maximum email client compatibility.
   */
  private buildNotificationHtml(title: string, body: string): string {
    const bodyHtml = body
      .split('\n')
      .map((line) => `<p style="margin: 4px 0;">${this.escapeHtml(line)}</p>`)
      .join('');

    return `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #1a1a1a; margin-top: 0;">${this.escapeHtml(title)}</h2>
    <div style="color: #333333; line-height: 1.6;">
      ${bodyHtml}
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #999999; font-size: 12px; margin-bottom: 0;">
      ระบบจัดการสัตว์จรจัด — อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ
    </p>
  </div>
</body>
</html>`.trim();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
