import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../../shared/services/cache.service';

const prisma = new PrismaClient();

/** Dashboard stats cache TTL: 5 minutes */
const DASHBOARD_CACHE_TTL = 300;

@Injectable()
export class DashboardService {
  constructor(private readonly cache: CacheService) {}

  async getOverview(district?: string) {
    const cacheKey = district ? `dashboard:overview:${district}` : 'dashboard:overview';

    // Try cache first
    const cached = await this.cache.get<ReturnType<DashboardService['buildOverview']> extends Promise<infer R> ? R : never>(cacheKey);
    if (cached) return cached;

    const result = await this.buildOverview(district);

    // Store in cache with 5-minute TTL
    await this.cache.set(cacheKey, result, DASHBOARD_CACHE_TTL);

    return result;
  }

  private async buildOverview(district?: string) {
    const animalWhere: any = { deletedAt: null };
    const reportWhere: any = {};
    if (district) { animalWhere.district = district; reportWhere.district = district; }

    const [
      totalAnimals, neuteredAnimals, adoptableAnimals, adoptedAnimals,
      totalReports, openReports, resolvedReports,
      totalCampaigns, activeCampaigns,
    ] = await Promise.all([
      prisma.animal.count({ where: animalWhere }),
      prisma.animal.count({ where: { ...animalWhere, neutered: true } }),
      prisma.animal.count({ where: { ...animalWhere, status: 'ADOPTABLE' } }),
      prisma.animal.count({ where: { ...animalWhere, status: 'ADOPTED' } }),
      prisma.report.count({ where: reportWhere }),
      prisma.report.count({ where: { ...reportWhere, status: { in: ['RECEIVED', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.report.count({ where: { ...reportWhere, status: 'RESOLVED' } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    ]);

    const neuteredRate = totalAnimals > 0 ? Math.round((neuteredAnimals / totalAnimals) * 100) : 0;
    const adoptionRate = totalAnimals > 0 ? Math.round((adoptedAnimals / totalAnimals) * 100) : 0;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

    return {
      animals: { total: totalAnimals, neutered: neuteredAnimals, neuteredRate, adoptable: adoptableAnimals, adopted: adoptedAnimals, adoptionRate },
      reports: { total: totalReports, open: openReports, resolved: resolvedReports, resolutionRate },
      campaigns: { total: totalCampaigns, active: activeCampaigns },
    };
  }

  async getActionItems(district?: string) {
    const cacheKey = district ? `dashboard:actions:${district}` : 'dashboard:actions';

    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const where: any = {};
    if (district) where.district = district;

    const [urgentUnassigned, overdueVaccines, pendingFollowUps] = await Promise.all([
      prisma.report.count({ where: { ...where, status: 'RECEIVED', urgent: true } }),
      prisma.vaccineSchedule.count({ where: { status: 'OVERDUE' } }),
      prisma.followUp.count({ where: { status: { in: ['OVERDUE', 'MISSED'] } } }),
    ]);

    const items: { type: string; label: string; count: number; priority: string }[] = [];
    if (urgentUnassigned > 0) items.push({ type: 'urgent_cases', label: 'เคสเร่งด่วนที่ยัง unassigned', count: urgentUnassigned, priority: 'CRITICAL' });
    if (overdueVaccines > 0) items.push({ type: 'overdue_vaccines', label: 'วัคซีนที่เลยกำหนด', count: overdueVaccines, priority: 'HIGH' });
    if (pendingFollowUps > 0) items.push({ type: 'pending_followups', label: 'Follow-up ที่ค้างอยู่', count: pendingFollowUps, priority: 'MEDIUM' });

    await this.cache.set(cacheKey, items, DASHBOARD_CACHE_TTL);

    return items;
  }

  /**
   * Invalidate all dashboard caches. Call when relevant data changes.
   */
  async invalidateCache(): Promise<void> {
    await this.cache.delByPattern('dashboard:*');
  }
}
