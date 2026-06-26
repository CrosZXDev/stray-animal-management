import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ReportGeneratorService {
  async generateMonthly(district?: string, month?: string) {
    const now = new Date();
    const targetMonth = month ? new Date(month + '-01') : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

    const dateFilter = { gte: targetMonth, lte: endOfMonth };
    const where: any = {};
    if (district) where.district = district;

    const [
      newAnimals, sterilizations, vaccinations,
      reportsCreated, reportsResolved,
      adoptions, newVolunteers,
    ] = await Promise.all([
      prisma.animal.count({ where: { ...where, createdAt: dateFilter } }),
      prisma.medicalRecord.count({ where: { type: 'STERILIZATION', createdAt: dateFilter } }),
      prisma.medicalRecord.count({ where: { type: 'VACCINATION', createdAt: dateFilter } }),
      prisma.report.count({ where: { ...where, createdAt: dateFilter } }),
      prisma.report.count({ where: { ...where, status: 'RESOLVED', updatedAt: dateFilter } }),
      prisma.adoptionApplication.count({ where: { status: 'CONFIRMED', confirmedDate: dateFilter } }),
      prisma.volunteer.count({ where: { createdAt: dateFilter } }),
    ]);

    return {
      period: `${targetMonth.toISOString().slice(0, 7)}`,
      district: district || 'ทั้งหมด',
      kpi: {
        newAnimals,
        sterilizations,
        vaccinations,
        reportsCreated,
        reportsResolved,
        resolutionRate: reportsCreated > 0 ? Math.round((reportsResolved / reportsCreated) * 100) : 0,
        adoptions,
        newVolunteers,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
