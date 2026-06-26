import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeedingService } from './feeding.service';
import { VolunteerService } from './volunteer.service';
import { FosterService } from './foster.service';
import { DonationService } from './donation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Community')
@Controller()
export class CommunityController {
  constructor(
    private readonly feedingService: FeedingService,
    private readonly volunteerService: VolunteerService,
    private readonly fosterService: FosterService,
    private readonly donationService: DonationService,
  ) {}

  // === Feeding Stations ===
  @Post('feeding-stations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลงทะเบียนจุดให้อาหาร' })
  async registerStation(@Body() body: any, @Request() req: any) {
    return this.feedingService.registerStation({ ...body, feederId: req.user.id });
  }

  @Post('feeding-stations/:id/check-in')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check-in จุดให้อาหาร (+5 points)' })
  async checkIn(@Param('id') id: string, @Body() body: { notes?: string }) {
    return this.feedingService.checkIn(id, body.notes);
  }

  @Get('feeding-stations')
  @ApiOperation({ summary: 'ดูจุดให้อาหารทั้งหมด' })
  async listStations(@Query('district') district?: string) {
    return this.feedingService.list(district);
  }

  // === Volunteers ===
  @Post('volunteers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลงทะเบียนอาสาสมัคร' })
  async registerVolunteer(@Body() body: { skills: string[]; district: string; availability: string }, @Request() req: any) {
    return this.volunteerService.register(req.user.id, body);
  }

  @Get('assignments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูงานที่เปิดรับ (matched by skill + area)' })
  async getAssignments(@Query('district') district: string, @Query('skills') skills: string) {
    return this.volunteerService.getAvailableAssignments(district, skills?.split(',') || []);
  }

  @Patch('assignments/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'รับงาน' })
  async acceptAssignment(@Param('id') id: string, @Request() req: any) {
    const volunteer = await this.volunteerService.register(req.user.id, { skills: [], district: '', availability: '' }).catch(() => null);
    return this.volunteerService.acceptAssignment(id, req.user.id);
  }

  @Patch('assignments/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ทำงานเสร็จ (บันทึกชั่วโมง)' })
  async completeAssignment(@Param('id') id: string, @Body() body: { hours: number }) {
    return this.volunteerService.completeAssignment(id, body.hours);
  }

  // === Foster ===
  @Post('foster')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'สมัคร foster สัตว์' })
  async applyFoster(@Body() body: { animalId: string }, @Request() req: any) {
    return this.fosterService.apply(req.user.id, body.animalId);
  }

  @Patch('foster/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'จบ foster period' })
  async completeFoster(@Param('id') id: string) {
    return this.fosterService.complete(id);
  }

  // === Donations ===
  @Post('donations')
  @ApiOperation({ summary: 'บริจาค/Sponsor' })
  async donate(@Body() body: { amount: number; type: string; animalId?: string; message?: string }, @Request() req: any) {
    return this.donationService.create({ ...body, donorId: req.user?.id });
  }

  @Get('donations/transparency')
  @ApiOperation({ summary: 'รายงานความโปร่งใส (รายรับ-รายจ่าย)' })
  async transparency() {
    return this.donationService.getTransparencyReport();
  }
}
