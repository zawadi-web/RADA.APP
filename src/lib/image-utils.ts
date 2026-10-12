/**
 * Client-side image compression utility.
 * Downscales images to max dimensions and compresses to JPEG (~70-120KB).
 * Prevents database connection resets and network timeouts on mobile/cellular.
 */
export async function compressImage(
  file: File,
  maxDimension = 1080,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawUrl = ev.target?.result as string;
      if (!rawUrl) {
        resolve("");
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(rawUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };

      img.onerror = () => {
        resolve(rawUrl);
      };

      img.src = rawUrl;
    };

    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
