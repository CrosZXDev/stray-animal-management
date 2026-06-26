import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageService, ALLOWED_MIME_TYPES } from '../image.service';
import { THUMBNAIL_SIZES } from '../image-optimizer.service';

/**
 * End-to-end integration test for the image upload flow.
 *
 * Tests the complete lifecycle:
 * 1. Request presigned URL (simulates POST /api/v1/images/presigned-url)
 * 2. Verify presigned URL structure (S3 bucket/key)
 * 3. Verify CDN URL is returned correctly
 * 4. Thumbnail generation (all sizes created)
 * 5. Validation errors (invalid content type, empty filename, too long filename)
 * 6. Full image lifecycle: presigned URL → CDN URL → thumbnail URLs
 */

// Mock sharp (used by ImageOptimizerService)
const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from('thumbnail-data'));
const mockMetadata = vi.fn().mockResolvedValue({ format: 'jpeg', width: 1200, height: 800 });
const mockResize = vi.fn().mockReturnThis();
const mockJpeg = vi.fn().mockReturnThis();
const mockPng = vi.fn().mockReturnThis();
const mockWebp = vi.fn().mockReturnThis();

const mockSharpInstance = {
  resize: mockResize,
  jpeg: mockJpeg,
  png: mockPng,
  webp: mockWebp,
  toBuffer: mockToBuffer,
  metadata: mockMetadata,
};

vi.mock('sharp', () => ({
  default: vi.fn().mockImplementation(() => mockSharpInstance),
  __esModule: true,
}));

// Mock AWS SDK — capture all S3 interactions
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ input, type: 'PutObject' })),
  DeleteObjectCommand: vi.fn().mockImplementation((input) => ({ input, type: 'DeleteObject' })),
  GetObjectCommand: vi.fn().mockImplementation((input) => ({ input, type: 'GetObject' })),
}));

const mockGetSignedUrl = vi.fn();
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

function createMockReadableStream(data: Buffer) {
  return {
    [Symbol.asyncIterator]: async function* () {
      yield data;
    },
  };
}

describe('Image Upload E2E Flow', () => {
  let imageService: ImageService;
  const TEST_BUCKET = 'stray-animal-images-test';
  const TEST_CDN_URL = 'https://cdn.stray-animal.test';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_S3_BUCKET = TEST_BUCKET;
    process.env.AWS_CLOUDFRONT_URL = TEST_CDN_URL;
    process.env.AWS_REGION = 'ap-southeast-1';

    // Mock presigned URL generation — returns a realistic S3 presigned URL
    mockGetSignedUrl.mockImplementation((_client, command) => {
      const bucket = command.input?.Bucket || TEST_BUCKET;
      const key = command.input?.Key || 'unknown-key';
      return Promise.resolve(
        `https://${bucket}.s3.ap-southeast-1.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300&X-Amz-Signature=mock-signature`,
      );
    });

    // Mock S3 send (for thumbnail generation — GetObject returns image, PutObject succeeds)
    mockSend.mockImplementation((command) => {
      if (command.type === 'GetObject') {
        return Promise.resolve({
          Body: createMockReadableStream(Buffer.from('mock-original-image')),
        });
      }
      return Promise.resolve({});
    });

    imageService = new ImageService();
  });

  describe('Step 1: Request presigned URL', () => {
    it('should return presigned URL, image key, and CDN URL for a valid request', async () => {
      const result = await imageService.getPresignedUploadUrl({
        filename: 'stray-cat.jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-001',
      });

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('imageKey');
      expect(result).toHaveProperty('cdnUrl');
    });

    it('should generate a presigned URL per folder (animals, reports, line-images)', async () => {
      const folders = ['animals', 'reports', 'line-images'] as const;

      for (const folder of folders) {
        const result = await imageService.getPresignedUploadUrl({
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
          folder,
          entityId: `entity-${folder}`,
        });

        expect(result.uploadUrl).toContain(TEST_BUCKET);
        expect(result.imageKey).toContain(folder);
      }
    });
  });

  describe('Step 2: Verify presigned URL structure', () => {
    it('should contain the correct S3 bucket in the URL', async () => {
      const result = await imageService.getPresignedUploadUrl({
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-002',
      });

      expect(result.uploadUrl).toContain(TEST_BUCKET);
    });

    it('should contain the correct image key in the presigned URL', async () => {
      const result = await imageService.getPresignedUploadUrl({
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-003',
      });

      expect(result.uploadUrl).toContain(result.imageKey);
    });

    it('should include AWS signature parameters in the URL', async () => {
      const result = await imageService.getPresignedUploadUrl({
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-004',
      });

      expect(result.uploadUrl).toContain('X-Amz-Algorithm');
      expect(result.uploadUrl).toContain('X-Amz-Signature');
      expect(result.uploadUrl).toContain('X-Amz-Expires=300');
    });

    it('should build proper S3 key structure for animals', async () => {
      const result = await imageService.getPresignedUploadUrl({
        filename: 'cat-photo.jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-100',
      });

      expect(result.imageKey).toMatch(/^animals\/animal-100\/\d+-cat-photo\.jpg$/);
    });

    it('should build proper S3 key structure for line-images', async () => {
      const result = await imageService.getPresignedUploadUrl({
        filename: 'message.jpg',
        contentType: 'image/jpeg',
        folder: 'line-images',
        entityId: 'msg-555',
      });

      expect(result.imageKey).toBe('line-images/msg-555.jpg');
    });
  });

  describe('Step 3: Verify CDN URL', () => {
    it('should return CDN URL with the CloudFront domain', async () => {
      const result = await imageService.getPresignedUploadUrl({
        filename: 'dog.png',
        contentType: 'image/png',
        folder: 'animals',
        entityId: 'animal-010',
      });

      expect(result.cdnUrl.startsWith(TEST_CDN_URL)).toBe(true);
    });

    it('should build CDN URL from the image key', async () => {
      const result = await imageService.getPresignedUploadUrl({
        filename: 'puppy.webp',
        contentType: 'image/webp',
        folder: 'reports',
        entityId: 'report-020',
      });

      expect(result.cdnUrl).toBe(`${TEST_CDN_URL}/${result.imageKey}`);
    });

    it('should produce accessible CDN URL via getCdnUrl helper', async () => {
      const result = await imageService.getPresignedUploadUrl({
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-011',
      });

      const cdnUrl = imageService.getCdnUrl(result.imageKey);
      expect(cdnUrl).toBe(result.cdnUrl);
    });
  });

  describe('Step 4: Thumbnail generation', () => {
    it('should generate thumbnails for all configured sizes', async () => {
      const imageKey = 'animals/animal-050/1700000000-cat.jpg';
      const result = await imageService.generateThumbnails(imageKey);

      expect(result.originalKey).toBe(imageKey);
      expect(result.thumbnails).toHaveLength(THUMBNAIL_SIZES.length);
    });

    it('should create correct thumbnail keys for each size', async () => {
      const imageKey = 'animals/animal-050/1700000000-cat.jpg';
      const result = await imageService.generateThumbnails(imageKey);

      for (let i = 0; i < THUMBNAIL_SIZES.length; i++) {
        const size = THUMBNAIL_SIZES[i];
        expect(result.thumbnails[i].key).toBe(
          `animals/animal-050/${size.suffix}-1700000000-cat.jpg`,
        );
        expect(result.thumbnails[i].width).toBe(size.width);
        expect(result.thumbnails[i].height).toBe(size.height);
      }
    });

    it('should return CDN URLs for each thumbnail', async () => {
      const imageKey = 'reports/report-060/1700000000-photo.png';
      const result = await imageService.generateThumbnails(imageKey);

      for (const thumbnail of result.thumbnails) {
        expect(thumbnail.cdnUrl.startsWith(TEST_CDN_URL)).toBe(true);
        expect(thumbnail.cdnUrl).toContain(thumbnail.key);
      }
    });

    it('should download original from S3 then upload thumbnails back', async () => {
      const imageKey = 'animals/animal-070/1700000000-dog.jpg';
      await imageService.generateThumbnails(imageKey);

      // 1 GetObject (download original) + 2 PutObjects (upload thumbnails)
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('Step 5: Validation errors', () => {
    it('should reject invalid content type', async () => {
      await expect(
        imageService.getPresignedUploadUrl({
          filename: 'document.pdf',
          contentType: 'application/pdf',
          folder: 'animals',
          entityId: 'animal-v1',
        }),
      ).rejects.toThrow('ไม่รองรับไฟล์ประเภท application/pdf');
    });

    it('should reject image/gif content type', async () => {
      await expect(
        imageService.getPresignedUploadUrl({
          filename: 'animated.gif',
          contentType: 'image/gif',
          folder: 'animals',
          entityId: 'animal-v2',
        }),
      ).rejects.toThrow('ไม่รองรับไฟล์ประเภท image/gif');
    });

    it('should reject empty filename', async () => {
      await expect(
        imageService.getPresignedUploadUrl({
          filename: '',
          contentType: 'image/jpeg',
          folder: 'animals',
          entityId: 'animal-v3',
        }),
      ).rejects.toThrow('ต้องระบุชื่อไฟล์');
    });

    it('should reject filename longer than 255 characters', async () => {
      const longFilename = 'a'.repeat(256) + '.jpg';
      await expect(
        imageService.getPresignedUploadUrl({
          filename: longFilename,
          contentType: 'image/jpeg',
          folder: 'animals',
          entityId: 'animal-v4',
        }),
      ).rejects.toThrow('ชื่อไฟล์ยาวเกินไป');
    });

    it('should accept filename at exactly 255 characters', async () => {
      const filename = 'a'.repeat(251) + '.jpg'; // 251 + 4 = 255
      const result = await imageService.getPresignedUploadUrl({
        filename,
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-v5',
      });

      expect(result.uploadUrl).toBeDefined();
    });

    it('should accept all allowed MIME types without error', async () => {
      for (const contentType of ALLOWED_MIME_TYPES) {
        await expect(
          imageService.getPresignedUploadUrl({
            filename: 'valid-file.jpg',
            contentType,
            folder: 'animals',
            entityId: 'animal-v6',
          }),
        ).resolves.toBeDefined();
      }
    });
  });

  describe('Step 6: Complete image lifecycle', () => {
    it('should complete full flow: presigned URL → CDN URL → thumbnails', async () => {
      // Step 1: Request presigned URL (simulates client calling POST /api/v1/images/presigned-url)
      const presignedResult = await imageService.getPresignedUploadUrl({
        filename: 'stray-dog-bangkok.jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-lifecycle-001',
      });

      // Verify presigned URL is valid for upload
      expect(presignedResult.uploadUrl).toContain(TEST_BUCKET);
      expect(presignedResult.uploadUrl).toContain('X-Amz-Signature');
      expect(presignedResult.imageKey).toMatch(/^animals\/animal-lifecycle-001\//);

      // Step 2: After client uploads, the CDN URL should be accessible
      const cdnUrl = imageService.getCdnUrl(presignedResult.imageKey);
      expect(cdnUrl).toBe(presignedResult.cdnUrl);
      expect(cdnUrl.startsWith(TEST_CDN_URL)).toBe(true);

      // Step 3: Generate thumbnails for the uploaded image
      const thumbnailResult = await imageService.generateThumbnails(presignedResult.imageKey);

      expect(thumbnailResult.originalKey).toBe(presignedResult.imageKey);
      expect(thumbnailResult.thumbnails).toHaveLength(2);

      // Step 4: Verify all CDN URLs are available
      const imageWithThumbs = imageService.getImageWithThumbnails(presignedResult.imageKey);

      expect(imageWithThumbs.originalKey).toBe(presignedResult.imageKey);
      expect(imageWithThumbs.cdnUrl).toBe(presignedResult.cdnUrl);
      expect(imageWithThumbs.thumbnails).toHaveLength(2);

      // Verify thumbnail structure
      expect(imageWithThumbs.thumbnails[0].width).toBe(200);
      expect(imageWithThumbs.thumbnails[0].height).toBe(200);
      expect(imageWithThumbs.thumbnails[0].cdnUrl).toContain('thumb-200');

      expect(imageWithThumbs.thumbnails[1].width).toBe(400);
      expect(imageWithThumbs.thumbnails[1].height).toBe(400);
      expect(imageWithThumbs.thumbnails[1].cdnUrl).toContain('thumb-400');
    });

    it('should handle lifecycle for report images', async () => {
      // Request presigned URL for a report image
      const presigned = await imageService.getPresignedUploadUrl({
        filename: 'injured-cat.png',
        contentType: 'image/png',
        folder: 'reports',
        entityId: 'report-lifecycle-001',
      });

      expect(presigned.imageKey).toMatch(/^reports\/report-lifecycle-001\//);
      expect(presigned.cdnUrl).toContain('reports/report-lifecycle-001');

      // Generate thumbnails
      const thumbs = await imageService.generateThumbnails(presigned.imageKey);
      expect(thumbs.thumbnails).toHaveLength(2);

      // All thumbnail CDN URLs should be under the same folder structure
      for (const thumb of thumbs.thumbnails) {
        expect(thumb.cdnUrl).toContain('reports/report-lifecycle-001');
        expect(thumb.cdnUrl.startsWith(TEST_CDN_URL)).toBe(true);
      }
    });

    it('should handle lifecycle for LINE message images', async () => {
      // LINE images use a fixed key format
      const presigned = await imageService.getPresignedUploadUrl({
        filename: 'line-photo.jpg',
        contentType: 'image/jpeg',
        folder: 'line-images',
        entityId: 'msg-lifecycle-001',
      });

      expect(presigned.imageKey).toBe('line-images/msg-lifecycle-001.jpg');
      expect(presigned.cdnUrl).toBe(`${TEST_CDN_URL}/line-images/msg-lifecycle-001.jpg`);

      // Generate thumbnails
      const thumbs = await imageService.generateThumbnails(presigned.imageKey);
      expect(thumbs.originalKey).toBe('line-images/msg-lifecycle-001.jpg');
      expect(thumbs.thumbnails[0].key).toBe('line-images/thumb-200-msg-lifecycle-001.jpg');
      expect(thumbs.thumbnails[1].key).toBe('line-images/thumb-400-msg-lifecycle-001.jpg');
    });

    it('should delete an image after lifecycle completion', async () => {
      // Upload
      const presigned = await imageService.getPresignedUploadUrl({
        filename: 'to-delete.jpg',
        contentType: 'image/jpeg',
        folder: 'animals',
        entityId: 'animal-delete-001',
      });

      // Delete should not throw
      await expect(imageService.deleteImage(presigned.imageKey)).resolves.not.toThrow();
    });
  });
});
