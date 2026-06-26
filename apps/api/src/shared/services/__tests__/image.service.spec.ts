import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageService, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../image.service';

// Mock sharp (transitive dependency via ImageOptimizerService)
vi.mock('sharp', () => ({
  default: vi.fn().mockImplementation(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('data')),
    metadata: vi.fn().mockResolvedValue({ format: 'jpeg' }),
  })),
  __esModule: true,
}));

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ input })),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ input })),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://bucket.s3.amazonaws.com/key?X-Amz-Signature=abc'),
}));

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(() => {
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.AWS_CLOUDFRONT_URL = 'https://cdn.test.com';
    process.env.AWS_REGION = 'ap-southeast-1';
    service = new ImageService();
  });

  describe('getPresignedUploadUrl', () => {
    it('should generate a presigned URL for animal images', async () => {
      const result = await service.getPresignedUploadUrl({
        filename: 'cat.jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-123',
      });

      expect(result.uploadUrl).toContain('https://');
      expect(result.imageKey).toMatch(/^animals\/animal-123\/\d+-cat\.jpg$/);
      expect(result.cdnUrl).toBe(`https://cdn.test.com/${result.imageKey}`);
    });

    it('should generate a presigned URL for report images', async () => {
      const result = await service.getPresignedUploadUrl({
        filename: 'report-photo.png',
        contentType: 'image/png',
        folder: 'reports',
        entityId: 'report-456',
      });

      expect(result.imageKey).toMatch(/^reports\/report-456\/\d+-report-photo\.png$/);
      expect(result.cdnUrl).toMatch(/^https:\/\/cdn\.test\.com\/reports\/report-456\//);

    });

    it('should generate a presigned URL for LINE message images', async () => {
      const result = await service.getPresignedUploadUrl({
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        folder: 'line-images',
        entityId: 'msg-789',
      });

      expect(result.imageKey).toBe('line-images/msg-789.jpg');
      expect(result.cdnUrl).toBe('https://cdn.test.com/line-images/msg-789.jpg');
    });

    it('should reject unsupported content types', async () => {
      await expect(
        service.getPresignedUploadUrl({
          filename: 'doc.pdf',
          contentType: 'application/pdf',
          folder: 'animals',
          entityId: 'animal-1',
        }),
      ).rejects.toThrow('ไม่รองรับไฟล์ประเภท application/pdf');
    });

    it('should reject empty filenames', async () => {
      await expect(
        service.getPresignedUploadUrl({
          filename: '',
          contentType: 'image/jpeg',
          folder: 'animals',
          entityId: 'animal-1',
        }),
      ).rejects.toThrow('ต้องระบุชื่อไฟล์');
    });

    it('should reject overly long filenames', async () => {
      const longFilename = 'a'.repeat(256) + '.jpg';
      await expect(
        service.getPresignedUploadUrl({
          filename: longFilename,
          contentType: 'image/jpeg',
          folder: 'animals',
          entityId: 'animal-1',
        }),
      ).rejects.toThrow('ชื่อไฟล์ยาวเกินไป');
    });

    it('should accept all allowed MIME types', async () => {
      for (const mimeType of ALLOWED_MIME_TYPES) {
        const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
        const result = await service.getPresignedUploadUrl({
          filename: `photo.${ext}`,
          contentType: mimeType,
          folder: 'animals',
          entityId: 'animal-1',
        });
        expect(result.uploadUrl).toBeDefined();
        expect(result.imageKey).toBeDefined();
        expect(result.cdnUrl).toBeDefined();
      }
    });

    it('should sanitize special characters in filenames', async () => {
      const result = await service.getPresignedUploadUrl({
        filename: 'my photo (1) [สุนัข].jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-1',
      });

      // Should not contain special characters except - _ .
      expect(result.imageKey).not.toMatch(/[\s()[\]]/);
    });
  });

  describe('validateFile', () => {
    it('should pass for valid files', () => {
      expect(() =>
        service.validateFile({ size: 5 * 1024 * 1024, mimetype: 'image/jpeg' }),
      ).not.toThrow();
    });

    it('should reject files exceeding 10MB', () => {
      expect(() =>
        service.validateFile({ size: MAX_FILE_SIZE + 1, mimetype: 'image/jpeg' }),
      ).toThrow('ไฟล์ใหญ่เกินไป');
    });

    it('should reject unsupported MIME types', () => {
      expect(() =>
        service.validateFile({ size: 1024, mimetype: 'image/gif' }),
      ).toThrow('ไม่รองรับไฟล์ประเภท image/gif');
    });
  });

  describe('getCdnUrl', () => {
    it('should return CloudFront CDN URL for a key', () => {
      const url = service.getCdnUrl('animals/abc/photo.jpg');
      expect(url).toBe('https://cdn.test.com/animals/abc/photo.jpg');
    });
  });

  describe('deleteImage', () => {
    it('should call S3 DeleteObject', async () => {
      await expect(service.deleteImage('animals/abc/photo.jpg')).resolves.not.toThrow();
    });
  });
});
