export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_MAX_SIZE = 400;
const DEFAULT_QUALITY = 0.85;

function getMaxSize(): number {
  const envValue = import.meta.env.VITE_PROFILE_PHOTO_MAX_SIZE;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_MAX_SIZE;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedImage(
  imageSrc: string,
  cropArea: CropArea,
  quality: number = DEFAULT_QUALITY,
  outputSize?: number,
  outputWidth?: number,
  outputHeight?: number
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  const size = outputSize ?? getMaxSize();
  const canvasWidth = outputWidth ?? size;
  const canvasHeight = outputHeight ?? size;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
}

export function useImageCrop() {
  const maxSize = getMaxSize();

  const cropImage = async (
    imageSrc: string,
    cropArea: CropArea,
    fileName: string = 'profile.jpg',
    quality: number = DEFAULT_QUALITY,
    outputSize?: number,
    outputWidth?: number,
    outputHeight?: number
  ): Promise<File> => {
    const blob = await getCroppedImage(imageSrc, cropArea, quality, outputSize, outputWidth, outputHeight);
    return blobToFile(blob, fileName);
  };

  return {
    cropImage,
    maxSize,
  };
}
