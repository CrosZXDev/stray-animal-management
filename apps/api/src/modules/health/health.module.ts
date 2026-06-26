import { Module } from '@nestjs/common';
import { HealthMedicalController } from './health.controller';
import { MedicalService } from './medical.service';
import { VaccineService } from './vaccine.service';
import { CampaignService } from './campaign.service';

@Module({
  controllers: [HealthMedicalController],
  providers: [MedicalService, VaccineService, CampaignService],
  exports: [MedicalService, VaccineService, CampaignService],
})
export class HealthModule {}
