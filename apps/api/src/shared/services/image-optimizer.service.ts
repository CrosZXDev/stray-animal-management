import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { Readable } from 'stream';
import { AppException } from '../exceptions/app.exception';

export interface ThumbnailSize {
  width: number;
  height: number;
  suffix: string;
}

export interface ThumbnailResult {
  key: string;
  cdnUrl: string;
  width: number;
  height: number;
}

export interface GenerateThumbnailsResult {
  originalKey: string;
  thumbnails: ThumbnailResult[];
}

export const THUMBNAIL_SIZES: ThumbnailSize[] = [
  { width: 200, height: 200, suffix: 'thumb-200' },
  { width: 400, height: 400, suffix: 'thumb-400' },
];

export const QUALITY_SETTINGS = {
  jpeg: 80,
  webp: 80,
  png: 9, // compression level (0-9)
} as const;

const SUPPORTED_FORMATS = ['jpeg', 'png', 'webp'] as const;
type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'stray-animal-images';
    this.cdnUrl = (process.env.AWS_CLOUDFRONT_URL || 'https://cdn.example.com').replace(/\/$/, '');

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
   * Generate thumbnails for an image stored in S3.
   *
   * Downloads the original, processes it into configured thumbnail sizes,
   * and uploads the thumbnails back to S3 alongside the original.
   *
   * Key format: {folder}/{entityId}/thumb-{size}-{filename}
   */
  async generateThumbnails(originalKey: string): Promise<GenerateThumbnailsResult> {
    this.logger.debug(`Generating thumbnails for: ${originalKey}`);

    const imageBuffer = await this.downloadFromS3(originalKey);
    const format = await this.detectFormat(imageBuffer);

    const thumbnails: ThumbnailResult[] = [];

    for (const size of THUMBNAIL_SIZES) {
      const thumbnailBuffer = await this.resizeImage(imageBuffer, size, format);
      const thumbnailKey = this.buildThumbnailKey(originalKey, size.suffix);

      await this.uploadToS3(thumbnailKey, thumbnailBuffer, format);

      thumbnails.push({
        key: thumbnailKey,
        cdnUrl: `${this.cdnUrl}/${thumbnailKey}`,
        width: size.width,
        height: size.height,
      });
    }

    this.logger.debug(
      `Generated ${thumbnails.length} thumbnails for: ${originalKey}`,
    );

    return { originalKey, thumbnails };
  }

  /**
   * Get CDN URLs for thumbnails given an original image key.
   * Does not check if thumbnails actually exist in S3.
   */
  getThumbnailUrls(originalKey: string): ThumbnailResult[] {
    return THUMBNAIL_SIZES.map((size) => {
      const thumbnailKey = this.buildThumbnailKey(originalKey, size.suffix);
      return {
        key: thumbnailKey,
        cdnUrl: `${this.cdnUrl}/${thumbnailKey}`,
        width: size.width,
        height: size.height,
      };
    });
  }

  /**
   * Build the S3 key for a thumbnail based on the original key.
   *
   * Example:
   *   original: animals/abc123/1700000000-cat.jpg
   *   thumb:    animals/abc123/thumb-200-1700000000-cat.jpg
   */
  buildThumbnailKey(originalKey: string, suffix: string): string {
    const lastSlashIndex = originalKey.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      return `${suffix}-${originalKey}`;
    }

    const folder = originalKey.substring(0, lastSlashIndex);
    const filename = originalKey.substring(lastSlashIndex + 1);
    return `${folder}/${suffix}-${filename}`;
  }

  /**
   * Resize an image buffer to the specified dimensions.
   * Uses cover mode to maintain aspect ratio and fill the target dimensions.
   */
  async resizeImage(
    buffer: Buffer,
    size: ThumbnailSize,
    format: SupportedFormat,
  ): Promise<Buffer> {
    let pipeline = sharp(buffer).resize(size.width, size.height, {
      fit: 'cover',
      position: 'centre',
    });

    pipeline = this.applyQualitySettings(pipeline, format);

    return pipeline.toBuffer();
  }

  /**
   * Detect the image format from the buffer metadata.
   */
  async detectFormat(buffer: Buffer): Promise<SupportedFormat> {
    const metadata = await sharp(buffer).metadata();
    const format = metadata.format;

    if (!format || !SUPPORTED_FORMATS.includes(format as SupportedFormat)) {
      throw AppException.validation(
        `ไม่รองรับรูปแบบไฟล์ ${format || 'unknown'} — รองรับเฉพาะ JPEG, PNG, WebP`,
      );
    }

    return format as SupportedFormat;
  }

  private applyQualitySettings(
    pipeline: sharp.Sharp,
    format: SupportedFormat,
  ): sharp.Sharp {
    switch (format) {
      case 'jpeg':
        return pipeline.jpeg({ quality: QUALITY_SETTINGS.jpeg });
      case 'webp':
        return pipeline.webp({ quality: QUALITY_SETTINGS.webp });
      case 'png':
        return pipeline.png({ compressionLevel: QUALITY_SETTINGS.png });
      default:
        return pipeline;
    }
  }

  private async downloadFromS3(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw AppException.notFound('Image', key);
    }

    return this.streamToBuffer(response.Body as Readable);
  }

  private async uploadToS3(
    key: string,
    buffer: Buffer,
    format: SupportedFormat,
  ): Promise<void> {
    const contentType = `image/${format}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        'generated-by': 'image-optimizer',
        'generated-at': new Date().toISOString(),
      },
    });

    await this.s3Client.send(command);
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
