import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../shared/exceptions/app.exception';

const prisma = new PrismaClient();

@Injectable()
export class ScreeningService {
  async registerAdopter(userId: string, data: {
    housingType: string;
    hasYard: boolean;
    experience: string;
    timeAvailable: string;
    householdMembers: number;
    existingPets?: string;
  }) {
    const existing = await prisma.adopter.findUnique({ where: { userId } });
    if (existing) throw AppException.conflict('คุณลงทะเบียนเป็นผู้รับเลี้ยงแล้ว');

    return prisma.adopter.create({
      data: { userId, ...data, screeningStatus: 'PENDING' },
    });
  }

  async evaluate(adopterId: string) {
    const adopter = await prisma.adopter.findUnique({ where: { id: adopterId } });
    if (!adopter) throw AppException.notFound('Adopter', adopterId);

    // Auto-screening logic
    let passed = true;
    const notes: string[] = [];

    // Basic checks
    if (adopter.householdMembers > 8) {
      notes.push('ครอบครัวขนาดใหญ่ — ต้อง interview เพิ่ม');
    }
    if (adopter.timeAvailable === 'none' || adopter.timeAvailable === '<1hr') {
      passed = false;
      notes.push('เวลาดูแลไม่เพียงพอ — แนะนำ foster แทน');
    }
    if (adopter.experience === 'none' && adopter.housingType === 'condo_small') {
      notes.push('ไม่มีประสบการณ์ + พื้นที่จำกัด — แนะนำเริ่มจากแมว');
    }

    const status = passed ? 'PASSED' : 'FAILED';
    await prisma.adopter.update({
      where: { id: adopterId },
      data: { screeningStatus: status, screeningNotes: notes.join('; ') },
    });

    return { adopterId, status, notes, suggestion: passed ? null : 'แนะนำ: ลองเป็น foster ก่อน' };
  }

  async getByUserId(userId: string) {
    return prisma.adopter.findUnique({ where: { userId } });
  }
}
