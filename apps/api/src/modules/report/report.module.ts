import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportRepository } from './report.repository';
import { CaseWorkflowService } from './case-workflow.service';
import { GamificationService } from './gamification.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, ReportRepository, CaseWorkflowService, GamificationService],
  exports: [ReportService],
})
export class ReportModule {}
