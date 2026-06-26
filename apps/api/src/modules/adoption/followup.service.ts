import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../../shared/services/notification.service';

const prisma = new PrismaClient();

// Follow-up schedule: 1 week, 1 month, 3 months after confirmation
const FOLLOW_UP_DAYS = [7, 30, 90];

@Injectable()
export class FollowUpService {
  private readonly logger = new Logger(FollowUpService.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Create follow-up schedule when adoption is confirmed
   */
  async createSchedule(applicationId: string) {
    const app = await prisma.adoptionApplication.findUnique({ where: { id: applicationId } });
    if (!app || !app.confirmedDate) return [];

    const followUps = FOLLOW_UP_DAYS.map((days) => ({
      applicationId,
      scheduledDate: new Date(app.confirmedDate!.getTime() + days * 24 * 60 * 60 * 1000),
      status: 'PENDING' as const,
      photoUrls: '[]',
    }));

    const created = await prisma.followUp.createMany({ data: followUps });
    this.logger.log(`Created ${created.count} follow-ups for application ${applicationId}`);

    return prisma.followUp.findMany({ where: { applicationId }, orderBy: { scheduledDate: 'asc' } });
  }

  /**
   * Complete a follow-up
   */
  async complete(followUpId: string, data: { photoUrls?: string[]; notes?: string }) {
    return prisma.followUp.update({
      where: { id: followUpId },
      data: {
        completedDate: new Date(),
        status: 'COMPLETED',
        photoUrls: JSON.stringify(data.photoUrls || []),
        notes: data.notes,
      },
    });
  }

  /**
   * Get follow-ups for an application
   */
  async getByApplication(applicationId: string) {
    return prisma.followUp.findMany({
      where: { applicationId },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  /**
   * Check for missed follow-ups (2 consecutive misses → notify officer).
   * Sends notifications to officers when adoptions need attention.
   */
  async checkMissed() {
    const now = new Date();
    // Mark overdue
    await prisma.followUp.updateMany({
      where: { scheduledDate: { lt: now }, status: 'PENDING' },
      data: { status: 'OVERDUE' },
    });

    // Find applications with 2+ consecutive misses
    const applications = await prisma.adoptionApplication.findMany({
      where: { status: 'CONFIRMED' },
      include: {
        followUps: { orderBy: { scheduledDate: 'asc' } },
        animal: { select: { name: true, animalId: true } },
        adopter: { select: { userId: true } },
      },
    });

    const needsAttention: string[] = [];
    for (const app of applications) {
      const consecutive = app.followUps.filter((f) => f.status === 'OVERDUE' || f.status === 'MISSED');
      if (consecutive.length >= 2) {
        needsAttention.push(app.id);
        // Mark as MISSED
        await prisma.followUp.updateMany({
          where: { applicationId: app.id, status: 'OVERDUE' },
          data: { status: 'MISSED' },
        });

        // Notify adopter about missed follow-up
        if (app.adopter?.userId) {
          const animalName = app.animal?.name || app.animal?.animalId || 'สัตว์';
          await this.notificationService.send({
            userId: app.adopter.userId,
            templateKey: 'followup_reminder',
            variables: {
              animalName,
              scheduledDate: now.toISOString().split('T')[0],
            },
            priority: 'high',
          });
        }

        // Notify officers about missed follow-ups
        const officers = await prisma.user.findMany({
          where: { role: 'OFFICER', isActive: true },
          select: { id: true },
        });

        for (const officer of officers) {
          const animalName = app.animal?.name || app.animal?.animalId || 'สัตว์';
          await this.notificationService.send({
            userId: officer.id,
            templateKey: 'followup_reminder',
            variables: {
              animalName,
              scheduledDate: now.toISOString().split('T')[0],
            },
            channels: ['in_app'],
            priority: 'high',
          });
        }
      }
    }

    if (needsAttention.length > 0) {
      this.logger.warn(`${needsAttention.length} adoptions need officer attention (2+ missed follow-ups)`);
    }

    return { checkedApplications: applications.length, needsAttention: needsAttention.length };
  }
}
