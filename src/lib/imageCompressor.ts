/**
 * High-performance client-side image compression utility.
 * Reduces Base64 image payload by up to 80-90% before Firestore storage,
 * preserving crisp visual quality while preventing document size bloat.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: "image/webp" | "image/jpeg";
}

export interface CompressionResult {
  base64: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  reductionPercentage: number;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = "image/webp"
  } = options;

  return new Promise((resolve, reject) => {
    const originalSizeKB = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image data."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale constraints
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Could not acquire 2D canvas rendering context."));
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first; fall back to JPEG if canvas doesn't support WebP
        let compressedBase64 = canvas.toDataURL(mimeType, quality);
        if (mimeType === "image/webp" && !compressedBase64.startsWith("data:image/webp")) {
          compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        }

        // Approximate base64 string size in KB
        const base64Length = compressedBase64.length - (compressedBase64.indexOf(",") + 1);
        const compressedSizeKB = Math.round((base64Length * 3) / 4 / 1024);
        const reductionPercentage = Math.max(
          0,
          Math.round(((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100)
        );

        resolve({
          base64: compressedBase64,
          originalSizeKB,
          compressedSizeKB,
          reductionPercentage
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
