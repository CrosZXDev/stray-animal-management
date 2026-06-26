import { Injectable } from '@nestjs/common';
import { AnimalRepository, AnimalSearchCriteria } from './animal.repository';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { AppException } from '../../shared/exceptions/app.exception';

@Injectable()
export class AnimalService {
  constructor(private readonly repo: AnimalRepository) {}

  async register(dto: CreateAnimalDto, registeredBy: string) {
    const animalId = await this.generateAnimalId();

    const animal = await this.repo.create({
      animalId,
      type: dto.type as any,
      name: dto.name,
      color: dto.color,
      size: dto.size as any,
      gender: dto.gender as any,
      personality: dto.personality,
      markings: dto.markings,
      estimatedAge: dto.estimatedAge,
      latitude: dto.latitude,
      longitude: dto.longitude,
      district: dto.district,
      registeredBy,
    });

    await this.repo.addHistory({
      animalId: animal.id,
      action: 'registered',
      details: JSON.stringify({ animalId: animal.animalId, registeredBy }),
      changedBy: registeredBy,
    });

    return animal;
  }

  async findById(id: string) {
    const animal = await this.repo.findById(id);
    if (!animal) throw AppException.notFound('Animal', id);
    return animal;
  }

  async findByAnimalId(animalId: string) {
    const animal = await this.repo.findByAnimalId(animalId);
    if (!animal) throw AppException.notFound('Animal', animalId);
    return animal;
  }

  async search(criteria: AnimalSearchCriteria) {
    return this.repo.search(criteria);
  }

  async update(id: string, dto: UpdateAnimalDto, updatedBy: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw AppException.notFound('Animal', id);

    const changes: string[] = [];
    if (dto.status && dto.status !== existing.status) {
      changes.push(`status: ${existing.status} → ${dto.status}`);
    }
    if (dto.neutered !== undefined && dto.neutered !== existing.neutered) {
      changes.push(`neutered: ${existing.neutered} → ${dto.neutered}`);
    }

    const updated = await this.repo.update(id, {
      ...dto,
      type: dto.type as any,
      size: dto.size as any,
      gender: dto.gender as any,
      status: dto.status as any,
      neuteredDate: dto.neutered && !existing.neutered ? new Date() : undefined,
      earTipped: dto.neutered ? true : undefined,
    });

    if (changes.length > 0) {
      await this.repo.addHistory({
        animalId: id,
        action: 'updated',
        details: JSON.stringify({ changes, updatedBy }),
        changedBy: updatedBy,
      });
    }

    return updated;
  }

  private async generateAnimalId(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = await this.repo.getNextSequence();
    return `ANM-${today}-${String(seq).padStart(4, '0')}`;
  }
}
