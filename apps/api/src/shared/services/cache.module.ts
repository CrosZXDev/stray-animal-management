import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * Global cache module — provides CacheService to all modules.
 * Uses Redis for caching with graceful fallback on connection errors.
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
