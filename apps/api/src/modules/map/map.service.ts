import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../../shared/services/cache.service';

const prisma = new PrismaClient();
const HEATMAP_THRESHOLD = 100;

/** Heatmap cache TTL: 2 minutes (data changes more frequently) */
const HEATMAP_CACHE_TTL = 120;

@Injectable()
export class MapService {
  constructor(private readonly cache: CacheService) {}

  async getHeatmapData(bounds?: { north: number; south: number; east: number; west: number }) {
    const cacheKey = bounds
      ? `map:heatmap:${bounds.north}:${bounds.south}:${bounds.east}:${bounds.west}`
      : 'map:heatmap:all';

    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const where: any = { deletedAt: null };
    if (bounds) {
      where.latitude = { gte: bounds.south, lte: bounds.north };
      where.longitude = { gte: bounds.west, lte: bounds.east };
    }

    const animals = await prisma.animal.findMany({
      where,
      select: { latitude: true, longitude: true, status: true },
    });

    const result = {
      points: animals.map((a) => ({ lat: a.latitude, lng: a.longitude, intensity: 0.8 })),
      total: animals.length,
      useHeatmap: animals.length >= HEATMAP_THRESHOLD,
    };

    await this.cache.set(cacheKey, result, HEATMAP_CACHE_TTL);

    return result;
  }

  async getMarkers(bounds?: { north: number; south: number; east: number; west: number }) {
    const where: any = { deletedAt: null };
    if (bounds) {
      where.latitude = { gte: bounds.south, lte: bounds.north };
      where.longitude = { gte: bounds.west, lte: bounds.east };
    }

    const animals = await prisma.animal.findMany({
      where,
      select: { id: true, animalId: true, name: true, type: true, color: true, status: true, latitude: true, longitude: true, district: true },
      take: 200,
    });

    return animals;
  }

  async getLayers() {
    const [feedingStations, zones] = await Promise.all([
      prisma.feedingStation.findMany({
        select: { id: true, latitude: true, longitude: true, district: true, feedingTime: true, isActive: true },
      }),
      prisma.zone.findMany({
        select: { id: true, name: true, district: true, boundary: true },
      }),
    ]);

    return { feedingStations, zones, shelters: [] /* TODO: shelter model */ };
  }

  /**
   * Invalidate heatmap cache. Call when animal locations change.
   */
  async invalidateHeatmapCache(): Promise<void> {
    await this.cache.delByPattern('map:heatmap:*');
  }
}
