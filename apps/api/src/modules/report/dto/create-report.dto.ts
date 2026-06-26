import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ enum: ['NEW_SIGHTING', 'INJURED', 'AGGRESSIVE', 'GROWING_PACK', 'ABUSE'] })
  @IsEnum(['NEW_SIGHTING', 'INJURED', 'AGGRESSIVE', 'GROWING_PACK', 'ABUSE'])
  type: string;

  @ApiProperty({ example: 'สุนัขขาเจ็บนอนอยู่หน้าตลาด' })
  @IsString()
  description: string;

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

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  urgent?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
