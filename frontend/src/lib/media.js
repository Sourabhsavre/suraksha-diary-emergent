import { PHOTO_MAX_WIDTH_PX, PHOTO_JPEG_QUALITY } from './constants';

// Compress a File/Blob image to max width 800px, JPEG 60%.
export async function compressImage(file, maxW = PHOTO_MAX_WIDTH_PX, quality = PHOTO_JPEG_QUALITY) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return dataUrl;
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}
