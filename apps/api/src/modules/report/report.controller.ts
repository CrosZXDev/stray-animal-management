import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CaseWorkflowService } from './case-workflow.service';
import { GamificationService } from './gamification.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly caseWorkflow: CaseWorkflowService,
    private readonly gamification: GamificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'แจ้งพบสัตว์จรจัด/ปัญหา (anonymous หรือ authenticated)' })
  async create(@Body() dto: CreateReportDto, @Request() req: any) {
    const reporterId = req.user?.id || null; // null = anonymous
    return this.reportService.create(dto, reporterId);
  }

  @Get(':trackingId')
  @ApiOperation({ summary: 'ติดตามสถานะรายงานด้วย tracking ID' })
  async findByTracking(@Param('trackingId') trackingId: string) {
    return this.reportService.findByTrackingId(trackingId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'ดูรายการรายงานทั้งหมด (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async search(
    @Query('status') status?: string,
    @Query('district') district?: string,
    @Query('type') type?: string,
    @Query('urgent') urgent?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportService.search({
      status, district, type,
      urgent: urgent ? urgent === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'Assign เคสให้ทีม' })
  async assign(
    @Param('id') id: string,
    @Body() body: { assigneeId: string; notes?: string },
    @Request() req: any,
  ) {
    return this.caseWorkflow.assign(id, body.assigneeId, req.user.id, body.notes);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'เริ่มดำเนินการ' })
  async start(@Param('id') id: string) {
    return this.caseWorkflow.startProgress(id);
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'VOLUNTEER', 'ADMIN')
  @ApiOperation({ summary: 'ปิดเคส (resolved)' })
  async resolve(
    @Param('id') id: string,
    @Body() body: { result: string },
    @Request() req: any,
  ) {
    return this.caseWorkflow.resolve(id, body.result, req.user.id);
  }

  @Get('leaderboard/top')
  @ApiOperation({ summary: 'Leaderboard ผู้แจ้งเบาะแส (top 10)' })
  async leaderboard(@Query('district') district?: string) {
    return this.gamification.getLeaderboard(district);
  }
}
