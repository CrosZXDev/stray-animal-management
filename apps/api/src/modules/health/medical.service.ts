import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../shared/exceptions/app.exception';

const prisma = new PrismaClient();

@Injectable()
export class MedicalService {
  async createRecord(data: {
    animalId: string;
    type: string;
    date: Date;
    vetId: string;
    description: string;
    medications?: string;
    notes?: string;
    photoUrls?: string[];
    offlineSync?: boolean;
  }) {
    const animal = await prisma.animal.findUnique({ where: { id: data.animalId } });
    if (!animal) throw AppException.notFound('Animal', data.animalId);

    const record = await prisma.medicalRecord.create({
      data: {
        animalId: data.animalId,
        type: data.type as any,
        date: data.date,
        vetId: data.vetId,
        description: data.description,
        medications: data.medications,
        notes: data.notes,
        photoUrls: JSON.stringify(data.photoUrls || []),
        offlineSync: data.offlineSync || false,
        syncedAt: data.offlineSync ? null : new Date(),
      },
    });

    // Auto-update animal status on sterilization
    if (data.type === 'STERILIZATION') {
      await prisma.animal.update({
        where: { id: data.animalId },
        data: { neutered: true, neuteredDate: data.date, earTipped: true },
      });
    }

    // Auto-update vaccinated flag
    if (data.type === 'VACCINATION') {
      await prisma.animal.update({
        where: { id: data.animalId },
        data: { vaccinated: true },
      });
    }

    return record;
  }

  async getByAnimal(animalId: string) {
    return prisma.medicalRecord.findMany({
      where: { animalId },
      orderBy: { date: 'desc' },
    });
  }

  async syncOfflineRecords(records: any[]) {
    const results = [];
    for (const record of records) {
      const created = await this.createRecord({ ...record, offlineSync: true });
      await prisma.medicalRecord.update({
        where: { id: created.id },
        data: { syncedAt: new Date() },
      });
      results.push(created);
    }
    return results;
  }

  async getStats(district?: string) {
    const where = district ? { animal: { district } } : {};
    const [total, sterilizations, vaccinations] = await Promise.all([
      prisma.medicalRecord.count({ where }),
      prisma.medicalRecord.count({ where: { ...where, type: 'STERILIZATION' } }),
      prisma.medicalRecord.count({ where: { ...where, type: 'VACCINATION' } }),
    ]);
    return { total, sterilizations, vaccinations };
  }
}
