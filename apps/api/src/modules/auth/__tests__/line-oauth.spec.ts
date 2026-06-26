import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../auth.service';
import { LineService } from '../../../shared/services/line.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

// Mock Prisma
const mockUser = {
  id: 'user-123',
  lineUserId: 'U1234567890abcdef',
  displayName: 'Test User',
  role: 'CITIZEN',
  email: null,
  isActive: true,
  district: null,
  consentGiven: true,
  consentDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-123',
          lineUserId: 'U1234567890abcdef',
          displayName: 'Test User',
          role: 'CITIZEN',
          email: null,
          isActive: true,
          district: null,
          consentGiven: true,
          consentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        create: vi.fn().mockResolvedValue({
          id: 'user-123',
          lineUserId: 'U1234567890abcdef',
          displayName: 'Test User',
          role: 'CITIZEN',
          email: null,
          isActive: true,
          district: null,
          consentGiven: true,
          consentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    })),
  };
});

describe('LINE OAuth Integration', () => {
  let authService: AuthService;
  let lineService: LineService;
  let jwtService: JwtService;

  beforeEach(() => {
    // Set env vars for LineService
    process.env.LINE_CHANNEL_ID = 'test-channel-id';
    process.env.LINE_CHANNEL_SECRET = 'test-channel-secret';
    process.env.LINE_CALLBACK_URL = 'http://localhost:3001/api/v1/auth/line/callback';
    process.env.APP_URL = 'http://localhost:3001';

    lineService = new LineService();
    jwtService = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '7d' } });
    authService = new AuthService(jwtService, lineService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getLineLoginUrl', () => {
    it('should return a valid LINE OAuth URL and state', () => {
      const result = authService.getLineLoginUrl();

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('state');
      expect(result.url).toContain('https://access.line.me/oauth2/v2.1/authorize');
      expect(result.url).toContain('client_id=test-channel-id');
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('scope=profile+openid');
      expect(result.url).toContain(`state=${result.state}`);
      expect(result.state).toHaveLength(32); // 16 bytes hex
    });

    it('should generate unique state for each call', () => {
      const result1 = authService.getLineLoginUrl();
      const result2 = authService.getLineLoginUrl();

      expect(result1.state).not.toBe(result2.state);
    });
  });

  describe('handleLineCallback', () => {
    it('should reject invalid state parameter', async () => {
      await expect(
        authService.handleLineCallback('valid-code', 'invalid-state'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject expired state parameter', async () => {
      // Generate a valid state
      const { state } = authService.getLineLoginUrl();

      // Manually expire the state by manipulating internal store
      const stateStore = (authService as any).stateStore;
      stateStore.set(state, { createdAt: Date.now() - 6 * 60 * 1000 }); // 6 minutes ago

      await expect(
        authService.handleLineCallback('valid-code', state),
      ).rejects.toThrow(BadRequestException);
    });

    it('should exchange code and return user with token on valid callback', async () => {
      // Generate a valid state
      const { state } = authService.getLineLoginUrl();

      // Mock LINE API calls
      const mockToken = { access_token: 'mock-access-token', expires_in: 3600, scope: 'profile openid', token_type: 'Bearer' };
      const mockProfile = { userId: 'U1234567890abcdef', displayName: 'Test User' };

      vi.spyOn(lineService, 'exchangeCodeForToken').mockResolvedValue(mockToken);
      vi.spyOn(lineService, 'getProfile').mockResolvedValue(mockProfile);

      const result = await authService.handleLineCallback('valid-code', state);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.lineUserId).toBe('U1234567890abcdef');
      expect(result.user.displayName).toBe('Test User');
      expect(typeof result.token).toBe('string');
    });

    it('should not allow state reuse', async () => {
      const { state } = authService.getLineLoginUrl();

      const mockToken = { access_token: 'mock-token', expires_in: 3600, scope: 'profile', token_type: 'Bearer' };
      const mockProfile = { userId: 'U1234567890abcdef', displayName: 'Test User' };

      vi.spyOn(lineService, 'exchangeCodeForToken').mockResolvedValue(mockToken);
      vi.spyOn(lineService, 'getProfile').mockResolvedValue(mockProfile);

      // First call should succeed
      await authService.handleLineCallback('code1', state);

      // Second call with same state should fail
      await expect(
        authService.handleLineCallback('code2', state),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('LineService', () => {
    it('should generate correct authorize URL', () => {
      const url = lineService.getAuthorizeUrl('test-state-123');

      expect(url).toBe(
        'https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=test-channel-id&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fv1%2Fauth%2Fline%2Fcallback&state=test-state-123&scope=profile+openid',
      );
    });

    it('should throw UnauthorizedException on token exchange failure', async () => {
      // Mock global fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('{"error":"invalid_grant"}'),
      });

      await expect(
        lineService.exchangeCodeForToken('bad-code'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token response on successful exchange', async () => {
      const mockTokenResponse = {
        access_token: 'access-token-123',
        expires_in: 2592000,
        id_token: 'id-token-123',
        refresh_token: 'refresh-token-123',
        scope: 'profile openid',
        token_type: 'Bearer',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await lineService.exchangeCodeForToken('valid-code');
      expect(result).toEqual(mockTokenResponse);
    });

    it('should fetch profile successfully', async () => {
      const mockProfile = {
        userId: 'U1234567890abcdef',
        displayName: 'LINE User',
        pictureUrl: 'https://profile.line-scdn.net/xxx',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProfile),
      });

      const result = await lineService.getProfile('access-token-123');
      expect(result).toEqual(mockProfile);

      expect(global.fetch).toHaveBeenCalledWith('https://api.line.me/v2/profile', {
        method: 'GET',
        headers: { Authorization: 'Bearer access-token-123' },
      });
    });

    it('should throw on profile fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(
        lineService.getProfile('invalid-token'),
      ).rejects.toThrow();
    });
  });
});
