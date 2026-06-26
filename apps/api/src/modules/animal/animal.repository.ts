import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnimalSearchCriteria {
  type?: string;
  district?: string;
  status?: string;
  neutered?: boolean;
  gender?: string;
  size?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AnimalRepository {
  async create(data: Prisma.AnimalCreateInput) {
    return prisma.animal.create({ data, include: { photos: true } });
  }

  async findById(id: string) {
    return prisma.animal.findUnique({
      where: { id },
      include: { photos: true, history: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  async findByAnimalId(animalId: string) {
    return prisma.animal.findUnique({
      where: { animalId },
      include: { photos: true },
    });
  }

  async search(criteria: AnimalSearchCriteria) {
    const { page = 1, limit = 20, ...filters } = criteria;
    const where: Prisma.AnimalWhereInput = { deletedAt: null };

    if (filters.type) where.type = filters.type as any;
    if (filters.district) where.district = filters.district;
    if (filters.status) where.status = filters.status as any;
    if (filters.neutered !== undefined) where.neutered = filters.neutered;
    if (filters.gender) where.gender = filters.gender as any;
    if (filters.size) where.size = filters.size as any;

    const [animals, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        include: { photos: { where: { isPrimary: true }, take: 1 } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.animal.count({ where }),
    ]);

    return { animals, total, page, limit };
  }

  async update(id: string, data: Prisma.AnimalUpdateInput) {
    return prisma.animal.update({ where: { id }, data });
  }

  async addPhoto(data: { animalId: string; url: string; thumbnail?: string; isPrimary?: boolean }) {
    return prisma.animalPhoto.create({ data });
  }

  async addHistory(data: { animalId: string; action: string; details: string; changedBy: string }) {
    return prisma.animalHistory.create({ data });
  }

  async countByDistrict(district: string) {
    return prisma.animal.count({ where: { district, deletedAt: null } });
  }

  async getNextSequence(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const pattern = `ANM-${today}-%`;
    const count = await prisma.animal.count({
      where: { animalId: { startsWith: `ANM-${today}` } },
    });
    return count + 1;
  }
}
