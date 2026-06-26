import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating notification preferences.
 * All fields are optional — only provided fields will be updated.
 */
export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable LINE notifications' })
  @IsOptional()
  @IsBoolean()
  lineEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable in-app notifications' })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Quiet hours start time (HH:mm format)', example: '22:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'quietHoursStart must be in HH:mm format' })
  quietHoursStart?: string | null;

  @ApiPropertyOptional({ description: 'Quiet hours end time (HH:mm format)', example: '07:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'quietHoursEnd must be in HH:mm format' })
  quietHoursEnd?: string | null;
}
