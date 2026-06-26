import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../../shared/services/notification.service';

const prisma = new PrismaClient();

// Vaccine intervals in days
const VACCINE_INTERVALS: Record<string, number> = {
  'rabies': 365,       // 1 year
  '5in1': 365,         // 1 year
  'fvrcp': 365,        // Cat 3-in-1, 1 year
  'felv': 365,         // Feline leukemia, 1 year
  'bordetella': 180,   // 6 months
};

@Injectable()
export class VaccineService {
  private readonly logger = new Logger(VaccineService.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Calculate and store next vaccine due date after vaccination
   */
  async scheduleNextVaccine(animalId: string, vaccineType: string, givenDate: Date) {
    const intervalDays = VACCINE_INTERVALS[vaccineType.toLowerCase()] || 365;
    const nextDue = new Date(givenDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    await prisma.vaccineSchedule.upsert({
      where: {
        id: await this.findScheduleId(animalId, vaccineType),
      },
      update: {
        lastGiven: givenDate,
        nextDue,
        status: 'SCHEDULED',
      },
      create: {
        animalId,
        vaccineType,
        lastGiven: givenDate,
        nextDue,
        status: 'SCHEDULED',
      },
    });

    return { animalId, vaccineType, nextDue };
  }

  /**
   * Get upcoming and overdue vaccine schedules
   */
  async getSchedule(filters?: { district?: string; status?: string }) {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = await prisma.vaccineSchedule.findMany({
      where: {
        nextDue: { lte: sevenDaysFromNow },
        status: { in: ['SCHEDULED', 'OVERDUE'] },
      },
      orderBy: { nextDue: 'asc' },
      take: 50,
    });

    return upcoming.map((v) => ({
      ...v,
      isOverdue: v.nextDue < now,
      daysUntilDue: Math.ceil((v.nextDue.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    }));
  }

  /**
   * Check for overdue vaccines and update status (called by scheduler/cron).
   * Sends reminder notifications to district officers for escalated cases.
   */
  async checkOverdue() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Mark as overdue if past due date
    const overdueCount = await prisma.vaccineSchedule.updateMany({
      where: {
        nextDue: { lt: now },
        status: 'SCHEDULED',
      },
      data: { status: 'OVERDUE' },
    });

    this.logger.log(`Marked ${overdueCount.count} vaccines as overdue`);

    // Escalate if 30+ days overdue — notify district officers
    const escalated = await prisma.vaccineSchedule.findMany({
      where: {
        nextDue: { lt: thirtyDaysAgo },
        status: 'OVERDUE',
      },
    });

    if (escalated.length > 0) {
      this.logger.warn(`${escalated.length} vaccines are 30+ days overdue — notifying officers`);

      // Notify officers about overdue vaccines
      const officers = await prisma.user.findMany({
        where: { role: 'OFFICER', isActive: true },
        select: { id: true },
      });

      for (const schedule of escalated) {
        for (const officer of officers) {
          await this.notificationService.send({
            userId: officer.id,
            templateKey: 'vaccine_reminder',
            variables: {
              animalName: schedule.animalId,
              animalId: schedule.animalId,
              vaccineType: schedule.vaccineType,
              dueDate: schedule.nextDue.toISOString().split('T')[0],
            },
            channels: ['in_app'],
            priority: 'high',
          });
        }
      }
    }

    return { markedOverdue: overdueCount.count, escalated: escalated.length };
  }

  /**
   * Send vaccine reminder notification to responsible users
   */
  async sendReminder(animalId: string, vaccineType: string, dueDate: Date, targetUserId: string) {
    await this.notificationService.send({
      userId: targetUserId,
      templateKey: 'vaccine_reminder',
      variables: {
        animalName: animalId,
        animalId,
        vaccineType,
        dueDate: dueDate.toISOString().split('T')[0],
      },
      priority: 'normal',
    });
  }

  private async findScheduleId(animalId: string, vaccineType: string): Promise<string> {
    const existing = await prisma.vaccineSchedule.findFirst({
      where: { animalId, vaccineType },
    });
    return existing?.id || 'non-existent-id-for-upsert';
  }
}
