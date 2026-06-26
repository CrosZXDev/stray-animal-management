import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ImageOptimizerService,
  THUMBNAIL_SIZES,
  QUALITY_SETTINGS,
} from '../image-optimizer.service';

// Mock sharp
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

vi.mock('sharp', () => {
  return {
    default: vi.fn().mockImplementation(() => mockSharpInstance),
    __esModule: true,
  };
});

// Mock AWS SDK
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  GetObjectCommand: vi.fn().mockImplementation((input) => ({ input, type: 'GetObject' })),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ input, type: 'PutObject' })),
}));

function createMockReadableStream(data: Buffer) {
  return {
    [Symbol.asyncIterator]: async function* () {
      yield data;
    },
  };
}

describe('ImageOptimizerService', () => {
  let service: ImageOptimizerService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.AWS_CLOUDFRONT_URL = 'https://cdn.test.com';
    process.env.AWS_REGION = 'ap-southeast-1';

    mockSend.mockImplementation((command) => {
      if (command.type === 'GetObject') {
        return Promise.resolve({
          Body: createMockReadableStream(Buffer.from('original-image-data')),
        });
      }
      return Promise.resolve({});
    });

    service = new ImageOptimizerService();
  });

  describe('buildThumbnailKey', () => {
    it('should build thumbnail key with folder prefix', () => {
      const key = service.buildThumbnailKey('animals/abc123/1700000000-cat.jpg', 'thumb-200');
      expect(key).toBe('animals/abc123/thumb-200-1700000000-cat.jpg');
    });

    it('should build thumbnail key for reports folder', () => {
      const key = service.buildThumbnailKey('reports/rpt-456/1700000000-photo.png', 'thumb-400');
      expect(key).toBe('reports/rpt-456/thumb-400-1700000000-photo.png');
    });

    it('should handle keys without folder path', () => {
      const key = service.buildThumbnailKey('image.jpg', 'thumb-200');
      expect(key).toBe('thumb-200-image.jpg');
    });

    it('should handle nested folder paths', () => {
      const key = service.buildThumbnailKey('a/b/c/photo.webp', 'thumb-400');
      expect(key).toBe('a/b/c/thumb-400-photo.webp');
    });
  });

  describe('getThumbnailUrls', () => {
    it('should return CDN URLs for all thumbnail sizes', () => {
      const results = service.getThumbnailUrls('animals/abc123/1700000000-cat.jpg');

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        key: 'animals/abc123/thumb-200-1700000000-cat.jpg',
        cdnUrl: 'https://cdn.test.com/animals/abc123/thumb-200-1700000000-cat.jpg',
        width: 200,
        height: 200,
      });
      expect(results[1]).toEqual({
        key: 'animals/abc123/thumb-400-1700000000-cat.jpg',
        cdnUrl: 'https://cdn.test.com/animals/abc123/thumb-400-1700000000-cat.jpg',
        width: 400,
        height: 400,
      });
    });

    it('should strip trailing slash from CDN URL', () => {
      process.env.AWS_CLOUDFRONT_URL = 'https://cdn.test.com/';
      const svc = new ImageOptimizerService();
      const results = svc.getThumbnailUrls('animals/id/photo.jpg');

      expect(results[0].cdnUrl).toBe('https://cdn.test.com/animals/id/thumb-200-photo.jpg');
    });
  });

  describe('generateThumbnails', () => {
    it('should download original, generate thumbnails, and upload them', async () => {
      const result = await service.generateThumbnails('animals/abc123/1700000000-cat.jpg');

      expect(result.originalKey).toBe('animals/abc123/1700000000-cat.jpg');
      expect(result.thumbnails).toHaveLength(2);
      expect(result.thumbnails[0].key).toBe('animals/abc123/thumb-200-1700000000-cat.jpg');
      expect(result.thumbnails[0].cdnUrl).toBe(
        'https://cdn.test.com/animals/abc123/thumb-200-1700000000-cat.jpg',
      );
      expect(result.thumbnails[0].width).toBe(200);
      expect(result.thumbnails[0].height).toBe(200);
      expect(result.thumbnails[1].key).toBe('animals/abc123/thumb-400-1700000000-cat.jpg');
      expect(result.thumbnails[1].width).toBe(400);
      expect(result.thumbnails[1].height).toBe(400);
    });

    it('should call S3 GetObject for the original image', async () => {
      await service.generateThumbnails('animals/abc123/photo.jpg');

      // One GetObject + two PutObjects (one per thumbnail size)
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should resize with cover fit mode', async () => {
      await service.generateThumbnails('animals/abc123/photo.jpg');

      expect(mockResize).toHaveBeenCalledWith(200, 200, {
        fit: 'cover',
        position: 'centre',
      });
      expect(mockResize).toHaveBeenCalledWith(400, 400, {
        fit: 'cover',
        position: 'centre',
      });
    });

    it('should apply JPEG quality settings for JPEG images', async () => {
      mockMetadata.mockResolvedValueOnce({ format: 'jpeg', width: 1200, height: 800 });
      await service.generateThumbnails('animals/abc123/photo.jpg');

      expect(mockJpeg).toHaveBeenCalledWith({ quality: QUALITY_SETTINGS.jpeg });
    });

    it('should apply WebP quality settings for WebP images', async () => {
      mockMetadata.mockResolvedValueOnce({ format: 'webp', width: 1200, height: 800 });
      await service.generateThumbnails('animals/abc123/photo.webp');

      expect(mockWebp).toHaveBeenCalledWith({ quality: QUALITY_SETTINGS.webp });
    });

    it('should apply PNG compression for PNG images', async () => {
      mockMetadata.mockResolvedValueOnce({ format: 'png', width: 1200, height: 800 });
      await service.generateThumbnails('animals/abc123/photo.png');

      expect(mockPng).toHaveBeenCalledWith({ compressionLevel: QUALITY_SETTINGS.png });
    });

    it('should throw when image not found in S3', async () => {
      mockSend.mockImplementationOnce(() =>
        Promise.resolve({ Body: undefined }),
      );

      await expect(service.generateThumbnails('nonexistent/key.jpg')).rejects.toThrow(
        'not found',
      );
    });

    it('should throw for unsupported image formats', async () => {
      mockMetadata.mockResolvedValueOnce({ format: 'gif', width: 400, height: 300 });

      await expect(
        service.generateThumbnails('animals/abc123/animation.gif'),
      ).rejects.toThrow('ไม่รองรับรูปแบบไฟล์ gif');
    });
  });

  describe('detectFormat', () => {
    it('should detect JPEG format', async () => {
      mockMetadata.mockResolvedValueOnce({ format: 'jpeg' });
      const format = await service.detectFormat(Buffer.from('test'));
      expect(format).toBe('jpeg');
    });

    it('should detect PNG format', async () => {
      mockMetadata.mockResolvedValueOnce({ format: 'png' });
      const format = await service.detectFormat(Buffer.from('test'));
      expect(format).toBe('png');
    });

    it('should detect WebP format', async () => {
      mockMetadata.mockResolvedValueOnce({ format: 'webp' });
      const format = await service.detectFormat(Buffer.from('test'));
      expect(format).toBe('webp');
    });

    it('should reject unsupported formats', async () => {
      mockMetadata.mockResolvedValueOnce({ format: 'tiff' });
      await expect(service.detectFormat(Buffer.from('test'))).rejects.toThrow(
        'ไม่รองรับรูปแบบไฟล์ tiff',
      );
    });

    it('should reject when format is undefined', async () => {
      mockMetadata.mockResolvedValueOnce({ format: undefined });
      await expect(service.detectFormat(Buffer.from('test'))).rejects.toThrow(
        'ไม่รองรับรูปแบบไฟล์ unknown',
      );
    });
  });

  describe('resizeImage', () => {
    it('should resize with specified dimensions and cover fit', async () => {
      const buffer = Buffer.from('test-image');
      await service.resizeImage(buffer, THUMBNAIL_SIZES[0], 'jpeg');

      expect(mockResize).toHaveBeenCalledWith(200, 200, {
        fit: 'cover',
        position: 'centre',
      });
      expect(mockJpeg).toHaveBeenCalledWith({ quality: 80 });
      expect(mockToBuffer).toHaveBeenCalled();
    });
  });

  describe('THUMBNAIL_SIZES constant', () => {
    it('should define two thumbnail sizes', () => {
      expect(THUMBNAIL_SIZES).toHaveLength(2);
    });

    it('should have 200x200 as the first size', () => {
      expect(THUMBNAIL_SIZES[0]).toEqual({ width: 200, height: 200, suffix: 'thumb-200' });
    });

    it('should have 400x400 as the second size', () => {
      expect(THUMBNAIL_SIZES[1]).toEqual({ width: 400, height: 400, suffix: 'thumb-400' });
    });
  });

  describe('QUALITY_SETTINGS constant', () => {
    it('should have JPEG quality of 80', () => {
      expect(QUALITY_SETTINGS.jpeg).toBe(80);
    });

    it('should have WebP quality of 80', () => {
      expect(QUALITY_SETTINGS.webp).toBe(80);
    });

    it('should have PNG compression level of 9', () => {
      expect(QUALITY_SETTINGS.png).toBe(9);
    });
  });
});
