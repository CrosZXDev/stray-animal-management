import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DonationService {
  async create(data: {
    donorId?: string;
    animalId?: string;
    amount: number;
    type: string;
    message?: string;
  }) {
    return prisma.donation.create({
      data: {
        donorId: data.donorId,
        animalId: data.animalId,
        amount: data.amount,
        type: data.type as any,
        message: data.message,
        status: 'COMPLETED',
      },
    });
  }

  async getTransparencyReport() {
    const [totalDonations, totalAmount, byType] = await Promise.all([
      prisma.donation.count(),
      prisma.donation.aggregate({ _sum: { amount: true } }),
      prisma.donation.groupBy({
        by: ['type'],
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalDonations,
      totalAmount: Number(totalAmount._sum.amount || 0),
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
        total: Number(t._sum.amount || 0),
      })),
    };
  }

  async getSponsoredAnimals(donorId: string) {
    return prisma.donation.findMany({
      where: { donorId, type: 'SPONSOR', animalId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
