import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnimalDto {
  @ApiProperty({ enum: ['DOG', 'CAT'] })
  @IsEnum(['DOG', 'CAT'])
  type: string;

  @ApiProperty({ required: false, example: 'โกโก้' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'น้ำตาล' })
  @IsString()
  color: string;

  @ApiProperty({ enum: ['SMALL', 'MEDIUM', 'LARGE'] })
  @IsEnum(['SMALL', 'MEDIUM', 'LARGE'])
  size: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'UNKNOWN'] })
  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'])
  gender: string;

  @ApiProperty({ required: false, example: 'เป็นมิตร ร่าเริง' })
  @IsOptional()
  @IsString()
  personality?: string;

  @ApiProperty({ required: false, example: 'มีจุดขาวที่หน้าผาก' })
  @IsOptional()
  @IsString()
  markings?: string;

  @ApiProperty({ required: false, example: '2 ปี' })
  @IsOptional()
  @IsString()
  estimatedAge?: string;

  @ApiProperty({ example: 13.7563 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 100.5018 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 'วัฒนา' })
  @IsString()
  district: string;
}
