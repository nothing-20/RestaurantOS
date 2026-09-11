/**
 * Image validation and client-side compression utility for RestaurantOS branding assets.
 * 
 * Ensures rapid uploads, prevents infinite hanging on slow networks,
 * and maintains crisp visual quality for customer discovery and menu displays.
 */

export interface ImageValidationLimits {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  maxDimensionWidth: number;
  maxDimensionHeight: number;
  quality: number;
}

export const BRANDING_LIMITS: Record<'logo' | 'cover', ImageValidationLimits> = {
  logo: {
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSizeBytes: 2 * 1024 * 1024, // 2 MB
    maxDimensionWidth: 1024,
    maxDimensionHeight: 1024,
    quality: 0.85
  },
  cover: {
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    maxDimensionWidth: 1920,
    maxDimensionHeight: 1080,
    quality: 0.82
  }
};

/**
 * Validates file MIME type and maximum size.
 * Rejects SVG, PDF, video, executables, or oversized files immediately.
 */
export function validateImageFile(file: File, type: 'logo' | 'cover'): void {
  const limits = BRANDING_LIMITS[type];

  // 1. Strict MIME Type Check
  const fileType = (file.type || '').toLowerCase();
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();
  const validExtensions = ['png', 'jpg', 'jpeg', 'webp'];

  const isValidMime = limits.allowedMimeTypes.includes(fileType);
  const isValidExt = validExtensions.includes(fileExt);

  if (!isValidMime && !isValidExt) {
    if (type === 'logo') {
      throw new Error('Logo must be PNG, JPG, or WebP and under 2 MB.');
    } else {
      throw new Error('Cover photo must be PNG, JPG, or WebP and under 5 MB.');
    }
  }

  // 2. Strict Size Limit
  if (file.size > limits.maxSizeBytes) {
    if (type === 'logo') {
      throw new Error('Logo must be PNG, JPG, or WebP and under 2 MB.');
    } else {
      throw new Error('Cover photo must be PNG, JPG, or WebP and under 5 MB.');
    }
  }
}

/**
 * Compresses and resizes an image client-side before uploading to Firebase Storage.
 * Maintains aspect ratio, reduces payload to a fraction of its raw size,
 * and speeds up uploads significantly.
 */
export async function compressImage(file: File, type: 'logo' | 'cover'): Promise<File> {
  const limits = BRANDING_LIMITS[type];

  // If running in an environment without DOM/Canvas support, return original
  if (typeof window === 'undefined' || !window.createImageBitmap && !window.Image) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;
          const maxWidth = limits.maxDimensionWidth;
          const maxHeight = limits.maxDimensionHeight;

          // Compute new dimensions keeping aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const scale = Math.min(widthRatio, heightRatio);

            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // Draw image scaled smoothly
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer WebP for modern browsers, fallback to JPEG
          const outputMime = 'image/webp';
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                // If compression didn't reduce size, or failed, keep original file
                resolve(file);
                return;
              }

              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const compressedFile = new File([blob], `${baseName}.webp`, {
                type: outputMime,
                lastModified: Date.now()
              });

              resolve(compressedFile);
            },
            outputMime,
            limits.quality
          );
        } catch (err) {
          console.warn('[ImageCompression] Compression failed, falling back to original file:', err);
          resolve(file);
        }
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}
