import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../shared/exceptions/app.exception';

const prisma = new PrismaClient();

@Injectable()
export class FosterService {
  async apply(volunteerId: string, animalId: string) {
    const animal = await prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) throw AppException.notFound('Animal', animalId);

    const existing = await prisma.fosterPeriod.findFirst({
      where: { volunteerId, animalId, status: 'ACTIVE' },
    });
    if (existing) throw AppException.conflict('คุณกำลัง foster สัตว์นี้อยู่แล้ว');

    const foster = await prisma.fosterPeriod.create({
      data: { volunteerId, animalId, startDate: new Date(), status: 'ACTIVE' },
    });

    await prisma.animal.update({ where: { id: animalId }, data: { status: 'FOSTERING' } });
    return foster;
  }

  async complete(fosterId: string) {
    const foster = await prisma.fosterPeriod.findUnique({ where: { id: fosterId } });
    if (!foster) throw AppException.notFound('FosterPeriod', fosterId);

    await prisma.fosterPeriod.update({
      where: { id: fosterId },
      data: { endDate: new Date(), status: 'COMPLETED' },
    });

    await prisma.animal.update({ where: { id: foster.animalId }, data: { status: 'ADOPTABLE' } });
    return { message: 'Foster period complete — สัตว์พร้อมรับเลี้ยง' };
  }

  async getActive(volunteerId?: string) {
    const where: any = { status: 'ACTIVE' };
    if (volunteerId) where.volunteerId = volunteerId;
    return prisma.fosterPeriod.findMany({ where, orderBy: { startDate: 'desc' } });
  }
}
