import { Cloudinary } from 'cloudinary-react-native';
import { ENV } from './env';

/**
 * Cloudinary Configuration
 * 
 * Initialize and configure Cloudinary for image optimization and CDN
 */

// Initialize Cloudinary only if credentials are available
export const cloudinary = ENV.CLOUDINARY_CLOUD_NAME
  ? new Cloudinary({
      cloud: {
        cloudName: ENV.CLOUDINARY_CLOUD_NAME,
      },
      url: {
        secure: true,
      },
    })
  : null;

// Log initialization status in development
if (__DEV__) {
  if (cloudinary) {
    console.log('☁️  Cloudinary initialized:', ENV.CLOUDINARY_CLOUD_NAME);
  } else {
    console.warn('⚠️ Cloudinary not configured. Add EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME to .env');
  }
}

/**
 * Upload Presets
 * These should be configured in Cloudinary dashboard
 */
export const UPLOAD_PRESETS = {
  AVATAR: ENV.CLOUDINARY_AVATAR_PRESET || 'mari-gunting-avatars',
  PORTFOLIO: ENV.CLOUDINARY_PORTFOLIO_PRESET || 'mari-gunting-portfolios',
  BARBERSHOP: ENV.CLOUDINARY_BARBERSHOP_PRESET || 'mari-gunting-barbershops',
  SERVICE: 'mari-gunting-services',
  REVIEW: 'mari-gunting-reviews',
} as const;

/**
 * Image Transformation Presets
 */
export const IMAGE_TRANSFORMATIONS = {
  // Avatar transformations
  AVATAR_THUMBNAIL: {
    width: 100,
    height: 100,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
  AVATAR_MEDIUM: {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
  AVATAR_LARGE: {
    width: 500,
    height: 500,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:best',
    fetch_format: 'auto',
  },

  // Portfolio/Barbershop transformations
  PORTFOLIO_THUMBNAIL: {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
  PORTFOLIO_MEDIUM: {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
  PORTFOLIO_LARGE: {
    width: 1200,
    height: 900,
    crop: 'limit',
    quality: 'auto:best',
    fetch_format: 'auto',
  },

  // Service image transformations
  SERVICE_THUMBNAIL: {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
  SERVICE_MEDIUM: {
    width: 600,
    height: 400,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto',
  },

  // Review image transformations
  REVIEW_THUMBNAIL: {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
  REVIEW_MEDIUM: {
    width: 600,
    height: 600,
    crop: 'limit',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
} as const;

/**
 * Image Quality Settings
 */
export const IMAGE_QUALITY = {
  THUMBNAIL: 'auto:eco',
  STANDARD: 'auto:good',
  HIGH: 'auto:best',
} as const;

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  PORTFOLIO: 10 * 1024 * 1024, // 10MB
  BARBERSHOP: 10 * 1024 * 1024, // 10MB
  SERVICE: 5 * 1024 * 1024, // 5MB
  REVIEW: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Allowed image formats
 */
export const ALLOWED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

/**
 * Cloudinary folders structure
 */
export const CLOUDINARY_FOLDERS = {
  AVATARS: 'mari-gunting/avatars',
  PORTFOLIOS: 'mari-gunting/portfolios',
  BARBERSHOPS: 'mari-gunting/barbershops',
  SERVICES: 'mari-gunting/services',
  REVIEWS: 'mari-gunting/reviews',
} as const;

/**
 * Get Cloudinary URL for an image with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: Record<string, any>
): string {
  if (!publicId || !cloudinary) return '';

  try {
    const image = cloudinary.image(publicId);
    
    if (transformations) {
      // Apply transformations
      Object.entries(transformations).forEach(([key, value]) => {
        image.addTransformation(key, value);
      });
    }

    return image.toURL();
  } catch (error) {
    console.error('Error generating Cloudinary URL:', error);
    return '';
  }
}

/**
 * Get optimized image URL with preset transformation
 */
export function getOptimizedImageUrl(
  publicId: string,
  preset: keyof typeof IMAGE_TRANSFORMATIONS
): string {
  return getCloudinaryUrl(publicId, IMAGE_TRANSFORMATIONS[preset]);
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

/**
 * Validate image file
 */
export function validateImageFile(
  fileUri: string,
  fileSize: number,
  fileType: string,
  category: keyof typeof MAX_FILE_SIZES
): { valid: boolean; error?: string } {
  // Check file size
  const maxSize = MAX_FILE_SIZES[category];
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    };
  }

  // Check file format
  if (!ALLOWED_FORMATS.includes(fileType as any)) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPEG, PNG, and WebP are allowed',
    };
  }

  return { valid: true };
}

export { Cloudinary };
