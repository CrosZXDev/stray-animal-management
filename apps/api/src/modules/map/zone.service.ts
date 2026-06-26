import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../shared/exceptions/app.exception';

const prisma = new PrismaClient();

@Injectable()
export class ZoneService {
  async create(data: { name: string; district: string; boundary: string; teamId: string }) {
    return prisma.zone.create({ data });
  }

  async assignTeam(zoneId: string, teamId: string) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw AppException.notFound('Zone', zoneId);
    return prisma.zone.update({ where: { id: zoneId }, data: { teamId } });
  }

  async getStats(zoneId: string) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw AppException.notFound('Zone', zoneId);

    const [animalCount, openCases, resolvedCases] = await Promise.all([
      prisma.animal.count({ where: { district: zone.district, deletedAt: null } }),
      prisma.report.count({ where: { district: zone.district, status: { in: ['RECEIVED', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.report.count({ where: { district: zone.district, status: 'RESOLVED' } }),
    ]);

    return { zone: zone.name, district: zone.district, animalCount, openCases, resolvedCases };
  }

  async list() {
    return prisma.zone.findMany({ orderBy: { district: 'asc' } });
  }
}
