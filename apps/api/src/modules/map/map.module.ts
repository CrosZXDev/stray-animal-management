import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { ZoneService } from './zone.service';
import { DashboardService } from './dashboard.service';
import { TaskService } from './task.service';
import { ReportGeneratorService } from './report-generator.service';

@Module({
  controllers: [MapController],
  providers: [MapService, ZoneService, DashboardService, TaskService, ReportGeneratorService],
  exports: [DashboardService],
})
export class MapModule {}
