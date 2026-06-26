import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'สมชาย' })
  @IsString()
  displayName: string;

  @ApiProperty({ required: false, example: 'CITIZEN' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false, example: 'วัฒนา' })
  @IsOptional()
  @IsString()
  district?: string;
}
