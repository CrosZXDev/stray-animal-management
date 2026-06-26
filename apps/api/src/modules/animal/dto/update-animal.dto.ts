import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAnimalDto {
  @ApiProperty({ required: false, enum: ['DOG', 'CAT'] })
  @IsOptional()
  @IsEnum(['DOG', 'CAT'])
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false, enum: ['SMALL', 'MEDIUM', 'LARGE'] })
  @IsOptional()
  @IsEnum(['SMALL', 'MEDIUM', 'LARGE'])
  size?: string;

  @ApiProperty({ required: false, enum: ['MALE', 'FEMALE', 'UNKNOWN'] })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'])
  gender?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  personality?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  neutered?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  vaccinated?: boolean;

  @ApiProperty({
    required: false,
    enum: ['STRAY', 'AWAITING_NEUTER', 'ADOPTABLE', 'IN_PROCESS', 'ADOPTED', 'FOSTERING', 'DECEASED'],
  })
  @IsOptional()
  @IsEnum(['STRAY', 'AWAITING_NEUTER', 'ADOPTABLE', 'IN_PROCESS', 'ADOPTED', 'FOSTERING', 'DECEASED'])
  status?: string;
}
