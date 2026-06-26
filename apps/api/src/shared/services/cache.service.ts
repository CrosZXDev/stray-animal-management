import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Redis-based caching service.
 * Provides get/set/del operations with optional TTL.
 * Used for dashboard stats (5-min TTL) and map heatmap data (2-min TTL).
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });

    this.redis.connect().catch((err) => {
      this.logger.warn(`Redis initial connect failed: ${err.message}. Cache will be bypassed.`);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * Get a cached value by key. Returns null on miss or Redis error.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      this.logger.warn(`Cache get error for key "${key}": ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Set a cached value. If ttlSeconds is provided, the key will expire after that duration.
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (err) {
      this.logger.warn(`Cache set error for key "${key}": ${(err as Error).message}`);
    }
  }

  /**
   * Delete a specific key from cache.
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Cache del error for key "${key}": ${(err as Error).message}`);
    }
  }

  /**
   * Delete all keys matching a pattern (e.g., "dashboard:*").
   * Uses SCAN to avoid blocking Redis with KEYS command.
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(`Cache delByPattern error for "${pattern}": ${(err as Error).message}`);
    }
  }
}
