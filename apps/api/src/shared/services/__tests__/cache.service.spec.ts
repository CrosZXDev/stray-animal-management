import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../cache.service';

// Mock ioredis
vi.mock('ioredis', () => {
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    scan: vi.fn(),
    quit: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  };
  return { default: vi.fn(() => mockRedis) };
});

import Redis from 'ioredis';

describe('CacheService', () => {
  let service: CacheService;
  let mockRedis: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CacheService();
    // Access the internal mock through the constructor
    mockRedis = (Redis as unknown as vi.Mock).mock.results[0]?.value;
    if (!mockRedis) {
      // Fallback: create fresh mock instance
      mockRedis = new (Redis as any)();
    }
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('get', () => {
    it('should return parsed data when key exists', async () => {
      const data = { total: 100, neutered: 50 };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await service.get<typeof data>('dashboard:overview');

      expect(result).toEqual(data);
      expect(mockRedis.get).toHaveBeenCalledWith('dashboard:overview');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('nonexistent:key');

      expect(result).toBeNull();
    });

    it('should return null on Redis error (graceful degradation)', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection refused'));

      const result = await service.get('dashboard:overview');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store serialized value with TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');
      const data = { animals: { total: 50 } };

      await service.set('dashboard:overview', data, 300);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'dashboard:overview',
        JSON.stringify(data),
        'EX',
        300,
      );
    });

    it('should store value without TTL when not specified', async () => {
      mockRedis.set.mockResolvedValue('OK');
      const data = { key: 'value' };

      await service.set('permanent:key', data);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'permanent:key',
        JSON.stringify(data),
      );
    });

    it('should not throw on Redis error (graceful degradation)', async () => {
      mockRedis.set.mockRejectedValue(new Error('Connection refused'));

      await expect(service.set('key', 'value', 60)).resolves.toBeUndefined();
    });

    it('should store without TTL when ttlSeconds is 0', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await service.set('key', 'value', 0);

      expect(mockRedis.set).toHaveBeenCalledWith('key', '"value"');
    });
  });

  describe('del', () => {
    it('should delete a specific key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.del('dashboard:overview');

      expect(mockRedis.del).toHaveBeenCalledWith('dashboard:overview');
    });

    it('should not throw on Redis error (graceful degradation)', async () => {
      mockRedis.del.mockRejectedValue(new Error('Connection refused'));

      await expect(service.del('key')).resolves.toBeUndefined();
    });
  });

  describe('delByPattern', () => {
    it('should scan and delete keys matching pattern', async () => {
      // First scan returns keys and cursor '0' (done)
      mockRedis.scan.mockResolvedValueOnce(['0', ['dashboard:overview', 'dashboard:overview:bang-kapi']]);
      mockRedis.del.mockResolvedValue(2);

      await service.delByPattern('dashboard:*');

      expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', 'dashboard:*', 'COUNT', 100);
      expect(mockRedis.del).toHaveBeenCalledWith('dashboard:overview', 'dashboard:overview:bang-kapi');
    });

    it('should handle multi-page scan results', async () => {
      // First scan returns cursor '5' (more to scan)
      mockRedis.scan.mockResolvedValueOnce(['5', ['map:heatmap:1']]);
      // Second scan returns cursor '0' (done)
      mockRedis.scan.mockResolvedValueOnce(['0', ['map:heatmap:2']]);
      mockRedis.del.mockResolvedValue(1);

      await service.delByPattern('map:heatmap:*');

      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
    });

    it('should not call del when no keys match', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', []]);

      await service.delByPattern('nonexistent:*');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should not throw on Redis error (graceful degradation)', async () => {
      mockRedis.scan.mockRejectedValue(new Error('Connection refused'));

      await expect(service.delByPattern('dashboard:*')).resolves.toBeUndefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis connection', async () => {
      mockRedis.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
