import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../shared/exceptions/app.exception';

const prisma = new PrismaClient();

@Injectable()
export class TaskService {
  async create(data: { title: string; type: string; assigneeId: string; priority: string; deadline: Date }) {
    return prisma.task.create({ data: { ...data, priority: data.priority as any, status: 'OPEN' } });
  }

  async update(id: string, data: { status?: string; completedAt?: Date }) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw AppException.notFound('Task', id);
    return prisma.task.update({ where: { id }, data: { ...data, status: data.status as any } });
  }

  async list(filters?: { assigneeId?: string; status?: string }) {
    const where: any = {};
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.status) where.status = filters.status;
    return prisma.task.findMany({ where, orderBy: [{ priority: 'desc' }, { deadline: 'asc' }] });
  }

  async checkOverdue() {
    const now = new Date();
    const result = await prisma.task.updateMany({
      where: { deadline: { lt: now }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      data: { status: 'OVERDUE' },
    });
    return { overdueCount: result.count };
  }
}
