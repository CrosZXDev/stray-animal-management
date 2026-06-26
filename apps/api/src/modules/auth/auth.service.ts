import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { LineService } from '../../shared/services/line.service';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  district?: string;
}

@Injectable()
export class AuthService {
  // In-memory state store for LINE OAuth CSRF protection
  // In production, use Redis for multi-instance support
  private readonly stateStore = new Map<string, { createdAt: number }>();
  private readonly STATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly jwtService: JwtService,
    private readonly lineService: LineService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    displayName: string;
    role?: string;
    district?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        displayName: data.displayName,
        role: (data.role as any) || 'CITIZEN',
        district: data.district,
        consentGiven: true,
        consentDate: new Date(),
      },
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async loginWithLine(lineUserId: string, displayName: string) {
    let user = await prisma.user.findUnique({
      where: { lineUserId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lineUserId,
          displayName,
          role: 'CITIZEN',
          consentGiven: true,
          consentDate: new Date(),
        },
      });
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  /**
   * Generate LINE OAuth login URL with CSRF state parameter
   */
  getLineLoginUrl(): { url: string; state: string } {
    const state = crypto.randomBytes(16).toString('hex');
    this.stateStore.set(state, { createdAt: Date.now() });

    // Cleanup expired states
    this.cleanupExpiredStates();

    const url = this.lineService.getAuthorizeUrl(state);
    return { url, state };
  }

  /**
   * Handle LINE OAuth callback: exchange code → get profile → find/create user → return JWT
   */
  async handleLineCallback(code: string, state: string) {
    // Validate state parameter (CSRF protection)
    const storedState = this.stateStore.get(state);
    if (!storedState) {
      throw new BadRequestException('Invalid or expired state parameter');
    }

    // Check if state has expired
    if (Date.now() - storedState.createdAt > this.STATE_TTL_MS) {
      this.stateStore.delete(state);
      throw new BadRequestException('State parameter has expired');
    }

    // Remove used state
    this.stateStore.delete(state);

    // Exchange authorization code for access token
    const tokenResponse = await this.lineService.exchangeCodeForToken(code);

    // Fetch LINE user profile
    const profile = await this.lineService.getProfile(tokenResponse.access_token);

    // Find or create user based on LINE userId
    return this.loginWithLine(profile.userId, profile.displayName);
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [key, value] of this.stateStore.entries()) {
      if (now - value.createdAt > this.STATE_TTL_MS) {
        this.stateStore.delete(key);
      }
    }
  }

  async validateUser(payload: JwtPayload) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) return null;
    return this.sanitizeUser(user);
  }

  private generateToken(user: any): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || '',
      role: user.role,
      district: user.district || undefined,
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
