import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MapService } from './map.service';
import { ZoneService } from './zone.service';
import { DashboardService } from './dashboard.service';
import { TaskService } from './task.service';
import { ReportGeneratorService } from './report-generator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Map & Dashboard')
@Controller()
export class MapController {
  constructor(
    private readonly mapService: MapService,
    private readonly zoneService: ZoneService,
    private readonly dashboardService: DashboardService,
    private readonly taskService: TaskService,
    private readonly reportGenerator: ReportGeneratorService,
  ) {}

  // === Map ===
  @Get('map/heatmap')
  @ApiOperation({ summary: 'ข้อมูล heatmap สัตว์จรจัด' })
  async getHeatmap(@Query('north') n?: string, @Query('south') s?: string, @Query('east') e?: string, @Query('west') w?: string) {
    const bounds = n && s && e && w ? { north: +n, south: +s, east: +e, west: +w } : undefined;
    return this.mapService.getHeatmapData(bounds);
  }

  @Get('map/markers')
  @ApiOperation({ summary: 'Markers สัตว์แต่ละตัว' })
  async getMarkers(@Query('north') n?: string, @Query('south') s?: string, @Query('east') e?: string, @Query('west') w?: string) {
    const bounds = n && s && e && w ? { north: +n, south: +s, east: +e, west: +w } : undefined;
    return this.mapService.getMarkers(bounds);
  }

  @Get('map/layers')
  @ApiOperation({ summary: 'Map layers (feeding stations, zones, shelters)' })
  async getLayers() { return this.mapService.getLayers(); }

  // === Zones ===
  @Post('zones')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth() @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'สร้างโซนรับผิดชอบ' })
  async createZone(@Body() body: { name: string; district: string; boundary: string; teamId: string }) {
    return this.zoneService.create(body);
  }

  @Patch('zones/:id/assign')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth() @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'มอบหมายทีมดูแลโซน' })
  async assignZone(@Param('id') id: string, @Body() body: { teamId: string }) {
    return this.zoneService.assignTeam(id, body.teamId);
  }

  @Get('zones/:id/stats')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'สถิติต่อโซน' })
  async zoneStats(@Param('id') id: string) { return this.zoneService.getStats(id); }

  // === Dashboard ===
  @Get('dashboard/overview')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth() @Roles('OFFICER', 'ADMIN', 'NGO')
  @ApiOperation({ summary: 'Dashboard ภาพรวม' })
  async overview(@Query('district') district?: string) {
    return this.dashboardService.getOverview(district);
  }

  @Get('dashboard/action-items')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth() @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'Action items ที่ต้องทำ' })
  async actionItems(@Query('district') district?: string) {
    return this.dashboardService.getActionItems(district);
  }

  // === Tasks ===
  @Post('tasks')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth() @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'สร้าง task' })
  async createTask(@Body() body: { title: string; type: string; assigneeId: string; priority: string; deadline: string }) {
    return this.taskService.create({ ...body, deadline: new Date(body.deadline) });
  }

  @Patch('tasks/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'อัพเดท task status' })
  async updateTask(@Param('id') id: string, @Body() body: { status: string }) {
    return this.taskService.update(id, { status: body.status, completedAt: body.status === 'COMPLETED' ? new Date() : undefined });
  }

  @Get('tasks')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'ดู task list' })
  async listTasks(@Query('assigneeId') assigneeId?: string, @Query('status') status?: string) {
    return this.taskService.list({ assigneeId, status });
  }

  // === Reports ===
  @Get('reports/monthly')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth() @Roles('OFFICER', 'ADMIN', 'NGO')
  @ApiOperation({ summary: 'รายงานประจำเดือน' })
  async monthlyReport(@Query('district') district?: string, @Query('month') month?: string) {
    return this.reportGenerator.generateMonthly(district, month);
  }
}
