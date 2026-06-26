import { Module } from '@nestjs/common';
import { AnimalController } from './animal.controller';
import { AnimalService } from './animal.service';
import { AnimalRepository } from './animal.repository';
import { DuplicateService } from './duplicate.service';

@Module({
  controllers: [AnimalController],
  providers: [AnimalService, AnimalRepository, DuplicateService],
  exports: [AnimalService],
})
export class AnimalModule {}
