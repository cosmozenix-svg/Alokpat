/**
 * Image compression utility to prevent local storage quota overflow
 * Resizes large photos from mobile devices/cameras to optimal web dimensions
 */
export async function compressImage(
  source: File | string,
  maxWidth: number = 1080,
  maxHeight: number = 1080,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calculate new dimensions keeping aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = maxHeight;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof source === 'string' ? source : '');
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        // Try WebP first for ultra small size, fallback to JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      } catch (e) {
        // Fallback to jpeg or original if toDataURL fails
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } catch {
          resolve(typeof source === 'string' ? source : '');
        }
      }
    };

    img.onerror = () => {
      if (typeof source === 'string') {
        resolve(source);
      } else {
        reject(new Error('Failed to load image for compression'));
      }
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => reject(new Error('File reader error'));
      reader.readAsDataURL(source);
    }
  });
}
