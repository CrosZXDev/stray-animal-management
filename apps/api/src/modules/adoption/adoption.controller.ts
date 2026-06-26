import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdoptionService } from './adoption.service';
import { ScreeningService } from './screening.service';
import { MatchingService } from './matching.service';
import { FollowUpService } from './followup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Adoption')
@Controller()
export class AdoptionController {
  constructor(
    private readonly adoptionService: AdoptionService,
    private readonly screeningService: ScreeningService,
    private readonly matchingService: MatchingService,
    private readonly followUpService: FollowUpService,
  ) {}

  @Get('adoption/profiles')
  @ApiOperation({ summary: 'ดูสัตว์ที่พร้อมรับเลี้ยง' })
  async getProfiles(@Query('type') type?: string, @Query('size') size?: string) {
    return this.adoptionService.getProfiles({ type, size });
  }

  @Post('adopters')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลงทะเบียนผู้รับเลี้ยง + screening questionnaire' })
  async registerAdopter(@Body() body: any, @Request() req: any) {
    return this.screeningService.registerAdopter(req.user.id, body);
  }

  @Post('adopters/:id/screening')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'ประเมิน screening' })
  async evaluate(@Param('id') id: string) {
    return this.screeningService.evaluate(id);
  }

  @Get('adopters/:id/recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'แนะนำสัตว์ที่เหมาะ (matching)' })
  async getRecommendations(@Param('id') id: string) {
    return this.matchingService.getRecommendations(id);
  }

  @Post('adoption/applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'สมัครรับเลี้ยงสัตว์' })
  async apply(@Body() body: { adopterId: string; animalId: string }) {
    return this.adoptionService.createApplication(body.adopterId, body.animalId);
  }

  @Patch('adoption/applications/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'อัพเดทสถานะ adoption (meeting → trial → confirmed/returned)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; meetingDate?: string; trialStartDate?: string; returnReason?: string },
  ) {
    const result = await this.adoptionService.updateApplicationStatus(id, body.status, {
      meetingDate: body.meetingDate ? new Date(body.meetingDate) : undefined,
      trialStartDate: body.trialStartDate ? new Date(body.trialStartDate) : undefined,
      returnReason: body.returnReason,
    });

    // Auto-create follow-up schedule on confirmation
    if (body.status === 'CONFIRMED') {
      await this.followUpService.createSchedule(id);
    }

    return result;
  }

  @Get('adoption/:applicationId/followups')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดู follow-up schedule' })
  async getFollowUps(@Param('applicationId') applicationId: string) {
    return this.followUpService.getByApplication(applicationId);
  }

  @Patch('followups/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'รายงาน follow-up (แนบรูป + notes)' })
  async completeFollowUp(@Param('id') id: string, @Body() body: { photoUrls?: string[]; notes?: string }) {
    return this.followUpService.complete(id, body);
  }
}
