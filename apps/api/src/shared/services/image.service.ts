import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppException } from '../exceptions/app.exception';
import {
  ImageOptimizerService,
  ThumbnailResult,
  GenerateThumbnailsResult,
} from './image-optimizer.service';

export interface PresignedUrlResult {
  uploadUrl: string;
  imageKey: string;
  cdnUrl: string;
}

export interface ImageWithThumbnails {
  originalKey: string;
  cdnUrl: string;
  thumbnails: ThumbnailResult[];
}

export interface PresignedUploadParams {
  filename: string;
  contentType: string;
  folder: 'animals' | 'reports' | 'line-images';
  entityId: string;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;
  private readonly imageOptimizer: ImageOptimizerService;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'stray-animal-images';
    this.cdnUrl = (process.env.AWS_CLOUDFRONT_URL || 'https://cdn.example.com').replace(/\/$/, '');
    this.imageOptimizer = new ImageOptimizerService();

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
      ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
  }

  /**
   * Generate a presigned PUT URL for direct client-side upload to S3.
   *
   * Folder structure:
   * - animals/{animalId}/{filename}
   * - reports/{reportId}/{filename}
   * - line-images/{messageId}.jpg
   */
  async getPresignedUploadUrl(params: PresignedUploadParams): Promise<PresignedUrlResult> {
    this.validateContentType(params.contentType);
    this.validateFilename(params.filename);

    const imageKey = this.buildKey(params);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: imageKey,
      ContentType: params.contentType,
      Metadata: {
        'original-filename': params.filename,
        'uploaded-at': new Date().toISOString(),
        folder: params.folder,
        'entity-id': params.entityId,
      },
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    const cdnUrl = `${this.cdnUrl}/${imageKey}`;

    this.logger.debug(`Generated presigned URL for key=${imageKey}, folder=${params.folder}`);

    return { uploadUrl, imageKey, cdnUrl };
  }

  /**
   * Delete an image from S3 by key.
   */
  async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.debug(`Deleted image: ${key}`);
  }

  /**
   * Get CDN URL for a given storage key.
   */
  getCdnUrl(key: string): string {
    return `${this.cdnUrl}/${key}`;
  }

  /**
   * Generate thumbnails for an uploaded image on-demand.
   * Returns CDN URLs for the original and all generated thumbnails.
   */
  async generateThumbnails(imageKey: string): Promise<GenerateThumbnailsResult> {
    return this.imageOptimizer.generateThumbnails(imageKey);
  }

  /**
   * Get CDN URLs for an image and its thumbnails.
   * Does not verify thumbnails exist — call generateThumbnails first if needed.
   */
  getImageWithThumbnails(imageKey: string): ImageWithThumbnails {
    return {
      originalKey: imageKey,
      cdnUrl: this.getCdnUrl(imageKey),
      thumbnails: this.imageOptimizer.getThumbnailUrls(imageKey),
    };
  }

  /**
   * Validate file metadata before upload (used for server-side checks).
   */
  validateFile(file: { size: number; mimetype: string }): void {
    if (file.size > MAX_FILE_SIZE) {
      throw AppException.validation(
        `ไฟล์ใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(1)}MB) — ขนาดสูงสุด 10MB`,
      );
    }
    this.validateContentType(file.mimetype);
  }

  /**
   * Build the S3 object key based on folder structure conventions.
   */
  private buildKey(params: PresignedUploadParams): string {
    const { folder, entityId, filename } = params;
    const ext = this.extractExtension(filename);
    const timestamp = Date.now();

    switch (folder) {
      case 'animals':
        return `animals/${entityId}/${timestamp}-${this.sanitizeFilename(filename)}`;
      case 'reports':
        return `reports/${entityId}/${timestamp}-${this.sanitizeFilename(filename)}`;
      case 'line-images':
        return `line-images/${entityId}.${ext}`;
      default:
        return `uploads/${entityId}/${timestamp}.${ext}`;
    }
  }

  private validateContentType(contentType: string): void {
    if (!ALLOWED_MIME_TYPES.includes(contentType as AllowedMimeType)) {
      throw AppException.validation(
        `ไม่รองรับไฟล์ประเภท ${contentType} — รองรับเฉพาะ image/jpeg, image/png, image/webp`,
      );
    }
  }

  private validateFilename(filename: string): void {
    if (!filename || filename.length === 0) {
      throw AppException.validation('ต้องระบุชื่อไฟล์');
    }
    if (filename.length > 255) {
      throw AppException.validation('ชื่อไฟล์ยาวเกินไป (สูงสุด 255 ตัวอักษร)');
    }
  }

  private extractExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }
}
