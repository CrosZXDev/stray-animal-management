import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../shared/exceptions/app.exception';

const prisma = new PrismaClient();

@Injectable()
export class AdoptionService {
  async getProfiles(filters?: { type?: string; size?: string; personality?: string }) {
    const where: any = { isAvailable: true };

    const animals = await prisma.animal.findMany({
      where: {
        status: 'ADOPTABLE',
        deletedAt: null,
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.size && { size: filters.size as any }),
      },
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        adoptionProfile: true,
        medicalRecords: { orderBy: { date: 'desc' }, take: 3 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return animals.map((a) => ({
      id: a.id,
      animalId: a.animalId,
      type: a.type,
      name: a.name,
      color: a.color,
      size: a.size,
      gender: a.gender,
      personality: a.personality,
      estimatedAge: a.estimatedAge,
      district: a.district,
      neutered: a.neutered,
      vaccinated: a.vaccinated,
      photo: a.photos[0]?.url || null,
      suitableFor: a.adoptionProfile?.suitableFor,
      specialNeeds: a.adoptionProfile?.specialNeeds,
      recentHealth: a.medicalRecords.map((r) => ({ type: r.type, date: r.date })),
    }));
  }

  async createApplication(adopterId: string, animalId: string) {
    const animal = await prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal || animal.status !== 'ADOPTABLE') {
      throw AppException.conflict('สัตว์นี้ไม่พร้อมสำหรับรับเลี้ยง');
    }

    // Check existing active application
    const existing = await prisma.adoptionApplication.findFirst({
      where: { adopterId, animalId, status: { in: ['INTERESTED', 'MEETING_SCHEDULED', 'TRIAL'] } },
    });
    if (existing) throw AppException.conflict('คุณมี application สำหรับสัตว์นี้อยู่แล้ว');

    const application = await prisma.adoptionApplication.create({
      data: { adopterId, animalId, status: 'INTERESTED' },
    });

    // Update animal status
    await prisma.animal.update({ where: { id: animalId }, data: { status: 'IN_PROCESS' } });

    return application;
  }

  async updateApplicationStatus(id: string, status: string, data?: { meetingDate?: Date; trialStartDate?: Date; returnReason?: string }) {
    const app = await prisma.adoptionApplication.findUnique({ where: { id } });
    if (!app) throw AppException.notFound('AdoptionApplication', id);

    const updateData: any = { status };
    if (data?.meetingDate) updateData.meetingDate = data.meetingDate;
    if (data?.trialStartDate) {
      updateData.trialStartDate = data.trialStartDate;
      updateData.trialEndDate = new Date(data.trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day trial
    }
    if (status === 'CONFIRMED') {
      updateData.confirmedDate = new Date();
      await prisma.animal.update({ where: { id: app.animalId }, data: { status: 'ADOPTED' } });
    }
    if (status === 'RETURNED') {
      updateData.returnReason = data?.returnReason;
      await prisma.animal.update({ where: { id: app.animalId }, data: { status: 'ADOPTABLE' } });
    }

    return prisma.adoptionApplication.update({ where: { id }, data: updateData });
  }
}
