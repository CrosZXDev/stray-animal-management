import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DuplicateCandidate {
  id: string;
  animalId: string;
  name: string | null;
  type: string;
  color: string;
  district: string;
  similarity: number; // 0-100
  reason: string;
}

@Injectable()
export class DuplicateService {
  /**
   * Check for potential duplicate animals based on:
   * - Location proximity (within 500m)
   * - Same type (dog/cat)
   * - Similar color
   * Future: image similarity (AI) — currently stubbed
   */
  async checkDuplicate(data: {
    type: string;
    color: string;
    latitude: number;
    longitude: number;
    district: string;
  }): Promise<DuplicateCandidate[]> {
    // Find animals within 500m radius with same type
    const nearbyAnimals = await prisma.animal.findMany({
      where: {
        type: data.type as any,
        deletedAt: null,
        // Simple proximity check (approximate, not exact geodistance)
        latitude: {
          gte: data.latitude - 0.005, // ~500m
          lte: data.latitude + 0.005,
        },
        longitude: {
          gte: data.longitude - 0.005,
          lte: data.longitude + 0.005,
        },
      },
      include: { photos: { where: { isPrimary: true }, take: 1 } },
    });

    // Score each candidate
    const candidates: DuplicateCandidate[] = nearbyAnimals
      .map((animal) => {
        let similarity = 0;
        const reasons: string[] = [];

        // Location proximity score (max 40)
        const distance = this.calculateDistance(
          data.latitude, data.longitude,
          animal.latitude, animal.longitude,
        );
        if (distance < 100) {
          similarity += 40;
          reasons.push('อยู่ใกล้มาก (<100m)');
        } else if (distance < 300) {
          similarity += 25;
          reasons.push('อยู่ใกล้ (<300m)');
        } else {
          similarity += 10;
          reasons.push('อยู่ในบริเวณ (<500m)');
        }

        // Color similarity (max 30)
        if (this.normalizeColor(data.color) === this.normalizeColor(animal.color)) {
          similarity += 30;
          reasons.push('สีเดียวกัน');
        } else if (this.colorsOverlap(data.color, animal.color)) {
          similarity += 15;
          reasons.push('สีคล้ายกัน');
        }

        // Same type gives base 20
        similarity += 20;
        reasons.push(`${animal.type === 'DOG' ? 'สุนัข' : 'แมว'}เหมือนกัน`);

        // Image similarity stub (future AI integration)
        // similarity += imageSimilarityScore; // max 10

        return {
          id: animal.id,
          animalId: animal.animalId,
          name: animal.name,
          type: animal.type,
          color: animal.color,
          district: animal.district,
          similarity: Math.min(similarity, 100),
          reason: reasons.join(', '),
        };
      })
      .filter((c) => c.similarity >= 50) // Only show >= 50% similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Top 5 candidates

    return candidates;
  }

  /**
   * Merge a duplicate animal into an existing record
   */
  async merge(targetId: string, sourceId: string, mergedBy: string) {
    const [target, source] = await Promise.all([
      prisma.animal.findUnique({ where: { id: targetId }, include: { photos: true } }),
      prisma.animal.findUnique({ where: { id: sourceId }, include: { photos: true } }),
    ]);

    if (!target || !source) {
      throw new Error('Target or source animal not found');
    }

    // Transfer photos from source to target
    if (source.photos.length > 0) {
      await prisma.animalPhoto.updateMany({
        where: { animalId: sourceId },
        data: { animalId: targetId, isPrimary: false },
      });
    }

    // Record merge in history
    await prisma.animalHistory.create({
      data: {
        animalId: targetId,
        action: 'merged',
        details: JSON.stringify({
          mergedFrom: source.animalId,
          mergedBy,
          sourceData: { color: source.color, district: source.district },
        }),
        changedBy: mergedBy,
      },
    });

    // Soft-delete the source
    await prisma.animal.update({
      where: { id: sourceId },
      data: { deletedAt: new Date() },
    });

    return target;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Haversine formula (returns meters)
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private normalizeColor(color: string): string {
    return color.toLowerCase().trim().replace(/\s+/g, '');
  }

  private colorsOverlap(color1: string, color2: string): boolean {
    const parts1 = color1.toLowerCase().split(/[-,\s]+/);
    const parts2 = color2.toLowerCase().split(/[-,\s]+/);
    return parts1.some((p) => parts2.includes(p));
  }
}
