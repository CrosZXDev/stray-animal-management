import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnimalService } from './animal.service';
import { DuplicateService } from './duplicate.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@ApiTags('Animals')
@Controller('animals')
export class AnimalController {
  constructor(
    private readonly animalService: AnimalService,
    private readonly duplicateService: DuplicateService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'VET', 'VOLUNTEER', 'ADMIN')
  @ApiOperation({ summary: 'ลงทะเบียนสัตว์จรจัดใหม่' })
  async create(@Body() dto: CreateAnimalDto, @Request() req: any) {
    return this.animalService.register(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'ค้นหาสัตว์จรจัด (filter + pagination)' })
  @ApiQuery({ name: 'type', required: false, enum: ['DOG', 'CAT'] })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'neutered', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('type') type?: string,
    @Query('district') district?: string,
    @Query('status') status?: string,
    @Query('neutered') neutered?: string,
    @Query('gender') gender?: string,
    @Query('size') size?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.animalService.search({
      type,
      district,
      status,
      neutered: neutered ? neutered === 'true' : undefined,
      gender,
      size,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return {
      ...result.animals,
      data: result.animals,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูข้อมูลสัตว์ตาม ID' })
  async findOne(@Param('id') id: string) {
    return this.animalService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'VET', 'VOLUNTEER', 'ADMIN')
  @ApiOperation({ summary: 'อัพเดทข้อมูลสัตว์' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnimalDto,
    @Request() req: any,
  ) {
    return this.animalService.update(id, dto, req.user.id);
  }

  @Post('check-duplicate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'VET', 'VOLUNTEER', 'ADMIN')
  @ApiOperation({ summary: 'ตรวจสอบสัตว์ซ้ำจากพิกัดและลักษณะ' })
  async checkDuplicate(
    @Body() body: { type: string; color: string; latitude: number; longitude: number; district: string },
  ) {
    return this.duplicateService.checkDuplicate(body);
  }

  @Post(':id/merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('OFFICER', 'ADMIN')
  @ApiOperation({ summary: 'รวมข้อมูลสัตว์ซ้ำเข้าด้วยกัน' })
  async merge(
    @Param('id') id: string,
    @Body() body: { sourceId: string },
    @Request() req: any,
  ) {
    return this.duplicateService.merge(id, body.sourceId, req.user.id);
  }
}
