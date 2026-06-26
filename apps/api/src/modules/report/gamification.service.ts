import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BADGE_THRESHOLDS = {
  BRONZE: 5,
  SILVER: 20,
  GOLD: 50,
};

const POINTS_PER_VERIFIED_REPORT = 10;

@Injectable()
export class GamificationService {
  /**
   * Award points when a report is verified as legitimate
   */
  async awardPoints(userId: string) {
    const score = await prisma.reporterScore.upsert({
      where: { userId },
      update: { points: { increment: POINTS_PER_VERIFIED_REPORT } },
      create: { userId, points: POINTS_PER_VERIFIED_REPORT },
    });

    // Check for badge upgrade
    const newBadge = this.calculateBadge(score.points);
    if (newBadge !== score.badge) {
      await prisma.reporterScore.update({
        where: { userId },
        data: { badge: newBadge },
      });
      // TODO: Notify user about new badge
    }

    return { points: score.points + POINTS_PER_VERIFIED_REPORT, badge: newBadge };
  }

  /**
   * Get leaderboard for a district (top 10)
   */
  async getLeaderboard(district?: string) {
    // Note: ReporterScore doesn't have district directly,
    // would need to join with User. For now return top 10 overall.
    const leaders = await prisma.reporterScore.findMany({
      orderBy: { points: 'desc' },
      take: 10,
    });

    return leaders.map((l, index) => ({
      rank: index + 1,
      userId: l.userId,
      points: l.points,
      badge: l.badge,
    }));
  }

  /**
   * Get a user's score
   */
  async getUserScore(userId: string) {
    const score = await prisma.reporterScore.findUnique({ where: { userId } });
    return score || { userId, points: 0, badge: 'NONE' };
  }

  private calculateBadge(points: number): string {
    if (points >= BADGE_THRESHOLDS.GOLD) return 'GOLD';
    if (points >= BADGE_THRESHOLDS.SILVER) return 'SILVER';
    if (points >= BADGE_THRESHOLDS.BRONZE) return 'BRONZE';
    return 'NONE';
  }
}
