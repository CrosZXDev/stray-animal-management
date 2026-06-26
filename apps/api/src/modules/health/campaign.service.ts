import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../shared/exceptions/app.exception';

const prisma = new PrismaClient();

@Injectable()
export class CampaignService {
  async create(data: {
    name: string;
    district: string;
    targetCount: number;
    budget: number;
    startDate: Date;
    endDate: Date;
    teamId: string;
  }) {
    return prisma.campaign.create({
      data: {
        name: data.name,
        district: data.district,
        targetCount: data.targetCount,
        budget: data.budget,
        budgetUsed: 0,
        startDate: data.startDate,
        endDate: data.endDate,
        teamId: data.teamId,
        status: 'PLANNED',
      },
    });
  }

  async recordResult(campaignId: string, data: {
    animalId?: string;
    actionType: string;
    notes?: string;
    performedBy: string;
  }) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw AppException.notFound('Campaign', campaignId);

    const result = await prisma.campaignResult.create({
      data: {
        campaignId,
        animalId: data.animalId,
        actionType: data.actionType,
        notes: data.notes,
        performedBy: data.performedBy,
      },
    });

    // Update actual count
    if (data.actionType === 'neutered') {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { actualCount: { increment: 1 } },
      });
    }

    return result;
  }

  async getById(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { results: true },
    });
    if (!campaign) throw AppException.notFound('Campaign', id);
    return {
      ...campaign,
      progress: campaign.targetCount > 0
        ? Math.round((campaign.actualCount / campaign.targetCount) * 100)
        : 0,
    };
  }

  async list(filters?: { district?: string; status?: string }) {
    const where: any = {};
    if (filters?.district) where.district = filters.district;
    if (filters?.status) where.status = filters.status;

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });

    return campaigns.map((c) => ({
      ...c,
      progress: c.targetCount > 0 ? Math.round((c.actualCount / c.targetCount) * 100) : 0,
    }));
  }

  async complete(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { results: true },
    });
    if (!campaign) throw AppException.notFound('Campaign', id);

    await prisma.campaign.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    return {
      id: campaign.id,
      name: campaign.name,
      target: campaign.targetCount,
      actual: campaign.actualCount,
      budget: campaign.budget,
      budgetUsed: campaign.budgetUsed,
      neutered: campaign.results.filter((r) => r.actionType === 'neutered').length,
      vaccinated: campaign.results.filter((r) => r.actionType === 'vaccinated').length,
      treated: campaign.results.filter((r) => r.actionType === 'treated').length,
      referred: campaign.results.filter((r) => r.actionType === 'referred').length,
    };
  }
}
