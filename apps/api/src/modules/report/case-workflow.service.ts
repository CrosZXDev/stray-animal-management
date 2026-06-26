import { Injectable, Logger } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { AppException } from '../../shared/exceptions/app.exception';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable()
export class CaseWorkflowService {
  private readonly logger = new Logger(CaseWorkflowService.name);

  constructor(
    private readonly repo: ReportRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async assign(reportId: string, assigneeId: string, assignedBy: string, notes?: string) {
    const report = await this.repo.findById(reportId);
    if (!report) throw AppException.notFound('Report', reportId);

    if (report.status === 'RESOLVED') {
      throw AppException.conflict('ไม่สามารถ assign เคสที่เสร็จสิ้นแล้ว');
    }

    await this.repo.createAssignment({
      report: { connect: { id: reportId } },
      assigneeId,
      assignedBy,
      notes,
    });

    await this.repo.update(reportId, { status: 'ASSIGNED' });

    // Notify assignee about new case assignment
    await this.notificationService.send({
      userId: assigneeId,
      templateKey: 'report_assigned',
      variables: {
        trackingId: report.trackingId,
        assignedTeam: assigneeId,
      },
      priority: 'normal',
    });

    this.logger.log(`Case ${report.trackingId} assigned to ${assigneeId}`);

    return this.repo.findById(reportId);
  }

  async startProgress(reportId: string) {
    const report = await this.repo.findById(reportId);
    if (!report) throw AppException.notFound('Report', reportId);

    await this.repo.update(reportId, { status: 'IN_PROGRESS' });
    return this.repo.findById(reportId);
  }

  async resolve(reportId: string, result: string, resolvedBy: string) {
    const report = await this.repo.findById(reportId);
    if (!report) throw AppException.notFound('Report', reportId);

    if (report.status === 'RESOLVED') {
      throw AppException.conflict('เคสนี้ resolved แล้ว');
    }

    await this.repo.update(reportId, { status: 'RESOLVED' });

    if (report.assignment) {
      await this.repo.updateAssignment(reportId, {
        resolvedAt: new Date(),
        result,
      });
    }

    // Notify reporter about resolution (if not anonymous)
    if (report.reporterId) {
      await this.notificationService.send({
        userId: report.reporterId,
        templateKey: 'report_resolved',
        variables: {
          trackingId: report.trackingId,
          resolution: result,
        },
        priority: 'normal',
      });
      this.logger.log(`Notified reporter ${report.reporterId} about resolution`);
    }

    return this.repo.findById(reportId);
  }

  async escalate(reportId: string, reason?: string) {
    const report = await this.repo.findById(reportId);
    if (!report) throw AppException.notFound('Report', reportId);

    await this.repo.update(reportId, { status: 'ESCALATED' });

    this.logger.warn(`Case ${report.trackingId} escalated. Reason: ${reason || 'SLA exceeded'}`);
    return this.repo.findById(reportId);
  }

  /**
   * Auto-determine priority from report type
   */
  getPriority(type: string, urgent: boolean): string {
    if (type === 'ABUSE') return 'CRITICAL';
    if (urgent || type === 'INJURED' || type === 'AGGRESSIVE') return 'HIGH';
    return 'MEDIUM';
  }
}
