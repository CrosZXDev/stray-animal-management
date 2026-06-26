import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppException } from '../../shared/exceptions/app.exception';

const prisma = new PrismaClient();

const BADGE_THRESHOLDS = { STARTER: 10, ACTIVE: 50, HERO: 200 };

@Injectable()
export class VolunteerService {
  async register(userId: string, data: {
    skills: string[];
    district: string;
    availability: string;
  }) {
    const existing = await prisma.volunteer.findUnique({ where: { userId } });
    if (existing) throw AppException.conflict('ลงทะเบียนอาสาสมัครแล้ว');

    return prisma.volunteer.create({
      data: { userId, ...data, skills: JSON.stringify(data.skills), totalHours: 0, badgeLevel: 'NONE' },
    });
  }

  async getAssignments(volunteerId: string, status?: string) {
    const where: any = { volunteerId };
    if (status) where.status = status;
    return prisma.assignment.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getAvailableAssignments(district: string, skills: string[]) {
    return prisma.assignment.findMany({
      where: {
        district,
        status: 'OPEN',
        type: { in: skills },
      },
      orderBy: { deadline: 'asc' },
      take: 20,
    });
  }

  async acceptAssignment(assignmentId: string, volunteerId: string) {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw AppException.notFound('Assignment', assignmentId);
    if (assignment.status !== 'OPEN') throw AppException.conflict('งานนี้ถูกรับแล้ว');

    return prisma.assignment.update({
      where: { id: assignmentId },
      data: { volunteerId, status: 'IN_PROGRESS' },
    });
  }

  async completeAssignment(assignmentId: string, hours: number) {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw AppException.notFound('Assignment', assignmentId);

    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: 'COMPLETED', completedAt: new Date(), hours },
    });

    // Update volunteer hours + badge
    const volunteer = await prisma.volunteer.update({
      where: { id: assignment.volunteerId },
      data: { totalHours: { increment: hours } },
    });

    const newBadge = this.calculateBadge(Number(volunteer.totalHours));
    if (newBadge !== volunteer.badgeLevel) {
      await prisma.volunteer.update({
        where: { id: volunteer.id },
        data: { badgeLevel: newBadge as any },
      });
    }

    return { hours: Number(volunteer.totalHours), badge: newBadge };
  }

  private calculateBadge(hours: number): string {
    if (hours >= BADGE_THRESHOLDS.HERO) return 'HERO';
    if (hours >= BADGE_THRESHOLDS.ACTIVE) return 'ACTIVE';
    if (hours >= BADGE_THRESHOLDS.STARTER) return 'STARTER';
    return 'NONE';
  }
}
