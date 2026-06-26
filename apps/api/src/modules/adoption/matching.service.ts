import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class MatchingService {
  /**
   * Recommend 3-5 animals matching adopter's lifestyle
   */
  async getRecommendations(adopterId: string) {
    const adopter = await prisma.adopter.findUnique({ where: { id: adopterId } });
    if (!adopter) return [];

    const adoptable = await prisma.animal.findMany({
      where: { status: 'ADOPTABLE', deletedAt: null },
      include: { photos: { where: { isPrimary: true }, take: 1 }, adoptionProfile: true },
    });

    // Score each animal based on adopter profile
    const scored = adoptable.map((animal) => {
      let score = 0;
      const reasons: string[] = [];

      // Size matching based on housing
      if (adopter.housingType === 'condo_small' || adopter.housingType === 'apartment') {
        if (animal.size === 'SMALL') { score += 30; reasons.push('ขนาดเหมาะกับที่อยู่'); }
        else if (animal.size === 'MEDIUM') { score += 15; }
        else { score -= 10; reasons.push('อาจใหญ่เกินไปสำหรับที่อยู่'); }
      } else if (adopter.hasYard) {
        score += 20; reasons.push('มีสนามให้วิ่งเล่น');
      }

      // Experience matching
      if (adopter.experience === 'none') {
        if (animal.personality?.includes('เป็นมิตร') || animal.personality?.includes('สงบ')) {
          score += 25; reasons.push('นิสัยดี เหมาะกับมือใหม่');
        }
      } else if (adopter.experience === 'experienced') {
        score += 10; // Any animal is fine
      }

      // Time matching
      if (adopter.timeAvailable === '>4hr') {
        score += 15;
      }

      // Cat preference for small spaces
      if ((adopter.housingType === 'condo_small' || !adopter.hasYard) && animal.type === 'CAT') {
        score += 10; reasons.push('แมวเหมาะกับคอนโด');
      }

      return { animal, score, reasons };
    });

    // Sort by score, return top 5
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => ({
        id: s.animal.id,
        animalId: s.animal.animalId,
        name: s.animal.name,
        type: s.animal.type,
        color: s.animal.color,
        size: s.animal.size,
        personality: s.animal.personality,
        photo: s.animal.photos[0]?.url || null,
        matchScore: s.score,
        reasons: s.reasons,
      }));
  }
}
