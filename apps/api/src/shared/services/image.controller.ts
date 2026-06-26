import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsNotEmpty, MaxLength } from 'class-validator';
import { ImageService, ALLOWED_MIME_TYPES } from './image.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

class GetPresignedUrlDto {
  @ApiProperty({ description: 'ชื่อไฟล์ต้นฉบับ', example: 'cat-photo.jpg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({
    description: 'MIME type ของไฟล์',
    enum: ALLOWED_MIME_TYPES,
    example: 'image/jpeg',
  })
  @IsString()
  @IsIn([...ALLOWED_MIME_TYPES])
  contentType!: string;

  @ApiProperty({
    description: 'โฟลเดอร์ปลายทาง',
    enum: ['animals', 'reports', 'line-images'],
    example: 'animals',
  })
  @IsString()
  @IsIn(['animals', 'reports', 'line-images'])
  folder!: 'animals' | 'reports' | 'line-images';

  @ApiProperty({
    description: 'ID ของ entity ที่เกี่ยวข้อง (animalId, reportId, หรือ messageId)',
    example: 'abc123',
  })
  @IsString()
  @IsNotEmpty()
  entityId!: string;
}

@ApiTags('Images')
@Controller('api/v1/images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ขอ presigned URL สำหรับ upload รูปภาพไปยัง S3' })
  async getPresignedUrl(@Body() dto: GetPresignedUrlDto) {
    return this.imageService.getPresignedUploadUrl({
      filename: dto.filename,
      contentType: dto.contentType,
      folder: dto.folder,
      entityId: dto.entityId,
    });
  }
}
