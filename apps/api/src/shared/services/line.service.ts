import { Injectable, UnauthorizedException, InternalServerErrorException, BadRequestException } from '@nestjs/common';

export interface LineTokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// LINE Messaging API types
export interface LineTextMessage {
  type: 'text';
  text: string;
}

export interface LineFlexMessage {
  type: 'flex';
  altText: string;
  contents: LineFlexContainer;
}

export interface LineFlexContainer {
  type: 'bubble' | 'carousel';
  [key: string]: unknown;
}

export type LineMessage = LineTextMessage | LineFlexMessage;

export interface LinePushResponse {
  sentMessages?: Array<{ id: string; quoteToken?: string }>;
}

export interface LineMulticastResponse {
  // LINE multicast API returns empty body on success (200 OK)
}

@Injectable()
export class LineService {
  private readonly channelId: string;
  private readonly channelSecret: string;
  private readonly callbackUrl: string;
  private readonly channelAccessToken: string;

  constructor() {
    this.channelId = process.env.LINE_CHANNEL_ID || '';
    this.channelSecret = process.env.LINE_CHANNEL_SECRET || '';
    this.callbackUrl = process.env.LINE_CALLBACK_URL || `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/auth/line/callback`;
    this.channelAccessToken = process.env.LINE_ACCESS_TOKEN || '';
  }

  /**
   * Generate LINE OAuth authorize URL with CSRF state parameter
   */
  getAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.channelId,
      redirect_uri: this.callbackUrl,
      state,
      scope: 'profile openid',
    });

    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<LineTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.callbackUrl,
      client_id: this.channelId,
      client_secret: this.channelSecret,
    });

    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new UnauthorizedException(
        `LINE token exchange failed: ${errorBody}`,
      );
    }

    return response.json() as Promise<LineTokenResponse>;
  }

  /**
   * Fetch user profile from LINE using access token
   */
  async getProfile(accessToken: string): Promise<LineProfile> {
    const response = await fetch('https://api.line.me/v2/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new InternalServerErrorException(
        `LINE profile fetch failed: ${errorBody}`,
      );
    }

    return response.json() as Promise<LineProfile>;
  }

  /**
   * Push a message to a single user via LINE userId
   */
  async pushMessage(to: string, messages: LineMessage[]): Promise<LinePushResponse> {
    if (!to) {
      throw new BadRequestException('LINE userId (to) is required');
    }
    if (!messages.length || messages.length > 5) {
      throw new BadRequestException('Messages array must contain 1-5 messages');
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
      body: JSON.stringify({ to, messages }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new InternalServerErrorException(
        `LINE push message failed: ${errorBody}`,
      );
    }

    return response.json() as Promise<LinePushResponse>;
  }

  /**
   * Push messages to multiple users (up to 500 per request)
   */
  async multicast(to: string[], messages: LineMessage[]): Promise<LineMulticastResponse> {
    if (!to.length || to.length > 500) {
      throw new BadRequestException('Multicast requires 1-500 user IDs');
    }
    if (!messages.length || messages.length > 5) {
      throw new BadRequestException('Messages array must contain 1-5 messages');
    }

    const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
      body: JSON.stringify({ to, messages }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new InternalServerErrorException(
        `LINE multicast failed: ${errorBody}`,
      );
    }

    // Multicast returns empty body on success
    const text = await response.text();
    return text ? (JSON.parse(text) as LineMulticastResponse) : {};
  }

  /**
   * Create a text message object
   */
  createTextMessage(text: string): LineTextMessage {
    return { type: 'text', text };
  }

  /**
   * Create a flex message object for rich notifications
   */
  createFlexMessage(altText: string, contents: LineFlexContainer): LineFlexMessage {
    return { type: 'flex', altText, contents };
  }

  /**
   * Convenience: push a simple text message to a single user
   */
  async pushTextMessage(to: string, text: string): Promise<LinePushResponse> {
    return this.pushMessage(to, [this.createTextMessage(text)]);
  }

  /**
   * Convenience: push a flex message to a single user
   */
  async pushFlexMessage(to: string, altText: string, contents: LineFlexContainer): Promise<LinePushResponse> {
    return this.pushMessage(to, [this.createFlexMessage(altText, contents)]);
  }
}
