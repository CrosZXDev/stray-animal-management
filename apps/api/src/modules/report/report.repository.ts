import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ReportRepository {
  async create(data: Prisma.ReportUncheckedCreateInput) {
    return prisma.report.create({ data });
  }

  async findByTrackingId(trackingId: string) {
    return prisma.report.findUnique({
      where: { trackingId },
      include: { assignment: true },
    });
  }

  async findById(id: string) {
    return prisma.report.findUnique({
      where: { id },
      include: { assignment: true, reporter: { select: { id: true, displayName: true } } },
    });
  }

  async search(filters: {
    status?: string;
    district?: string;
    type?: string;
    urgent?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, ...where } = filters;
    const prismaWhere: Prisma.ReportWhereInput = {};

    if (where.status) prismaWhere.status = where.status as any;
    if (where.district) prismaWhere.district = where.district;
    if (where.type) prismaWhere.type = where.type as any;
    if (where.urgent !== undefined) prismaWhere.urgent = where.urgent;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: prismaWhere,
        include: { assignment: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ urgent: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.report.count({ where: prismaWhere }),
    ]);

    return { reports, total, page, limit };
  }

  async update(id: string, data: Prisma.ReportUpdateInput) {
    return prisma.report.update({ where: { id }, data });
  }

  async createAssignment(data: Prisma.CaseAssignmentCreateInput) {
    return prisma.caseAssignment.create({ data });
  }

  async updateAssignment(reportId: string, data: Prisma.CaseAssignmentUpdateInput) {
    return prisma.caseAssignment.update({ where: { reportId }, data });
  }

  async getNextSequence(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.report.count({
      where: { trackingId: { startsWith: `RPT-${today}` } },
    });
    return count + 1;
  }

  async countByStatus(district?: string) {
    const where: Prisma.ReportWhereInput = {};
    if (district) where.district = district;

    const [received, assigned, inProgress, resolved, escalated] = await Promise.all([
      prisma.report.count({ where: { ...where, status: 'RECEIVED' } }),
      prisma.report.count({ where: { ...where, status: 'ASSIGNED' } }),
      prisma.report.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.report.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.report.count({ where: { ...where, status: 'ESCALATED' } }),
    ]);

    return { received, assigned, inProgress, resolved, escalated };
  }
}
