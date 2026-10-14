import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadableFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    this.initCloudinary();
  }

  private initCloudinary() {
    const cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName.trim(),
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(`Initialized Cloudinary configuration for cloud: ${cloudName}`);
    } else {
      this.logger.warn('Cloudinary credentials not provided. Image upload will be limited.');
    }
  }

  /**
   * Upload an image file to Cloudinary
   */
  async uploadImage(
    file: UploadableFile,
    folder: string = 'careerlaunch/avatars',
  ): Promise<{ url: string; secureUrl: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('No image file provided for upload');
    }

    // Validate mime type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file format. Only JPEG, PNG, WEBP, and GIF images are supported.',
      );
    }

    // Max file size: 5MB
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Image size cannot exceed 5MB');
    }

    if (!this.isConfigured) {
      this.logger.warn('Cloudinary not configured, returning data URI fallback');
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataUri = `data:${file.mimetype};base64,${b64}`;
      return {
        url: dataUri,
        secureUrl: dataUri,
        publicId: `fallback_${Date.now()}`,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed: ${error?.message}`);
            return reject(
              new BadRequestException(
                `Cloudinary image upload failed: ${error?.message || 'Unknown error'}`,
              ),
            );
          }

          this.logger.log(`Cloudinary image uploaded successfully: ${result.secure_url}`);
          resolve({
            url: result.secure_url || result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }
}
