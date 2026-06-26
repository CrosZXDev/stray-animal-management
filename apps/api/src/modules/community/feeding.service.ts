import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../shared/exceptions/app.exception';

const prisma = new PrismaClient();
const POINTS_PER_CHECKIN = 5;
const ACTIVE_THRESHOLD_DAYS = 7;

@Injectable()
export class FeedingService {
  async registerStation(data: {
    feederId: string;
    latitude: number;
    longitude: number;
    district: string;
    feedingTime: string;
    animalCount: number;
    photoUrl?: string;
  }) {
    return prisma.feedingStation.create({
      data: { ...data, isActive: true },
    });
  }

  async checkIn(stationId: string, notes?: string) {
    const station = await prisma.feedingStation.findUnique({ where: { id: stationId } });
    if (!station) throw AppException.notFound('FeedingStation', stationId);

    const checkIn = await prisma.checkIn.create({
      data: { stationId, notes },
    });

    await prisma.feedingStation.update({
      where: { id: stationId },
      data: { lastCheckIn: new Date(), isActive: true },
    });

    // Award points to feeder
    await prisma.reporterScore.upsert({
      where: { userId: station.feederId },
      update: { points: { increment: POINTS_PER_CHECKIN } },
      create: { userId: station.feederId, points: POINTS_PER_CHECKIN },
    });

    return checkIn;
  }

  async list(district?: string) {
    const where: any = {};
    if (district) where.district = district;

    const stations = await prisma.feedingStation.findMany({
      where,
      orderBy: { lastCheckIn: 'desc' },
    });

    const now = new Date();
    return stations.map((s) => ({
      ...s,
      isActive: s.lastCheckIn
        ? (now.getTime() - s.lastCheckIn.getTime()) < ACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
        : false,
    }));
  }

  async getStats() {
    const [total, active] = await Promise.all([
      prisma.feedingStation.count(),
      prisma.feedingStation.count({
        where: {
          lastCheckIn: { gte: new Date(Date.now() - ACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);
    return { total, active, inactive: total - active };
  }
}
