import { Module } from '@nestjs/common';
import { AdoptionController } from './adoption.controller';
import { AdoptionService } from './adoption.service';
import { ScreeningService } from './screening.service';
import { MatchingService } from './matching.service';
import { FollowUpService } from './followup.service';

@Module({
  controllers: [AdoptionController],
  providers: [AdoptionService, ScreeningService, MatchingService, FollowUpService],
  exports: [AdoptionService],
})
export class AdoptionModule {}
