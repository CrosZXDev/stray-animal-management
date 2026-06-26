import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalService } from './medical.service';
import { VaccineService } from './vaccine.service';
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Health & Medical')
@Controller()
export class HealthMedicalController {
  constructor(
    private readonly medicalService: MedicalService,
    private readonly vaccineService: VaccineService,
    private readonly campaignService: CampaignService,
  ) {}

  // === Medical Records ===

  @Post('animals/:animalId/medical-records')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('VET', 'OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'บันทึก medical record' })
  async createRecord(
    @Param('animalId') animalId: string,
    @Body() body: { type: string; date: string; description: string; medications?: string; notes?: string; photoUrls?: string[]; offlineSync?: boolean },
    @Request() req: any,
  ) {
    return this.medicalService.createRecord({
      animalId,
      type: body.type,
      date: new Date(body.date),
      vetId: req.user.id,
      description: body.description,
      medications: body.medications,
      notes: body.notes,
      photoUrls: body.photoUrls,
      offlineSync: body.offlineSync,
    });
  }

  @Get('animals/:animalId/medical-records')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูประวัติสุขภาพของสัตว์' })
  async getRecords(@Param('animalId') animalId: string) {
    return this.medicalService.getByAnimal(animalId);
  }

  @Post('medical-records/sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('VET', 'ADMIN')
  @ApiOperation({ summary: 'Sync offline medical records' })
  async syncOffline(@Body() body: { records: any[] }) {
    return this.medicalService.syncOfflineRecords(body.records);
  }

  // === Vaccine Schedule ===

  @Get('vaccines/schedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('VET', 'OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'ดู vaccine schedule (upcoming + overdue)' })
  async getVaccineSchedule(@Query('district') district?: string) {
    return this.vaccineService.getSchedule({ district });
  }

  // === Campaigns ===

  @Post('campaigns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'สร้าง TNR campaign ใหม่' })
  async createCampaign(@Body() body: { name: string; district: string; targetCount: number; budget: number; startDate: string; endDate: string; teamId: string }) {
    return this.campaignService.create({
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Get('campaigns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูรายการ campaigns' })
  async listCampaigns(@Query('district') district?: string, @Query('status') status?: string) {
    return this.campaignService.list({ district, status });
  }

  @Get('campaigns/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูรายละเอียด campaign' })
  async getCampaign(@Param('id') id: string) {
    return this.campaignService.getById(id);
  }

  @Post('campaigns/:id/record')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('VET', 'OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'บันทึกผล campaign (neutered/vaccinated/treated)' })
  async recordResult(
    @Param('id') id: string,
    @Body() body: { animalId?: string; actionType: string; notes?: string },
    @Request() req: any,
  ) {
    return this.campaignService.recordResult(id, { ...body, performedBy: req.user.id });
  }

  @Patch('campaigns/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'ปิด campaign + สรุปผล' })
  async completeCampaign(@Param('id') id: string) {
    return this.campaignService.complete(id);
  }

  // === Stats ===

  @Get('stats/health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'ADMIN', 'NGO')
  @ApiOperation({ summary: 'สถิติสุขภาพสัตว์จรจัด (ทำหมัน, วัคซีน)' })
  async getHealthStats(@Query('district') district?: string) {
    return this.medicalService.getStats(district);
  }
}
