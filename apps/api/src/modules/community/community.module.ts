import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { FeedingService } from './feeding.service';
import { VolunteerService } from './volunteer.service';
import { FosterService } from './foster.service';
import { DonationService } from './donation.service';

@Module({
  controllers: [CommunityController],
  providers: [FeedingService, VolunteerService, FosterService, DonationService],
  exports: [FeedingService, VolunteerService],
})
export class CommunityModule {}
