import { Injectable } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { CreateReportDto } from './dto/create-report.dto';
import { AppException } from '../../shared/exceptions/app.exception';

@Injectable()
export class ReportService {
  constructor(private readonly repo: ReportRepository) {}

  async create(dto: CreateReportDto, reporterId?: string) {
    const trackingId = await this.generateTrackingId();
    const slaDeadline = this.calculateSLA(dto.type, dto.urgent);

    const report = await this.repo.create({
      trackingId,
      type: dto.type as any,
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
      district: dto.district,
      urgent: dto.urgent || false,
      anonymous: !reporterId,
      status: 'RECEIVED',
      reporterId,
      photoUrls: JSON.stringify(dto.photoUrls || []),
      slaDeadline,
    });

    return report;
  }

  async findByTrackingId(trackingId: string) {
    const report = await this.repo.findByTrackingId(trackingId);
    if (!report) throw AppException.notFound('Report', trackingId);
    return report;
  }

  async search(filters: {
    status?: string;
    district?: string;
    type?: string;
    urgent?: boolean;
    page?: number;
    limit?: number;
  }) {
    return this.repo.search(filters);
  }

  async getStats(district?: string) {
    return this.repo.countByStatus(district);
  }

  private async generateTrackingId(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = await this.repo.getNextSequence();
    return `RPT-${today}-${String(seq).padStart(4, '0')}`;
  }

  private calculateSLA(type: string, urgent?: boolean): Date {
    const now = new Date();
    let hoursToAdd: number;

    if (type === 'ABUSE') {
      hoursToAdd = 4; // Critical
    } else if (urgent || type === 'INJURED' || type === 'AGGRESSIVE') {
      hoursToAdd = 24; // High
    } else {
      hoursToAdd = 72; // Normal
    }

    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }
}
