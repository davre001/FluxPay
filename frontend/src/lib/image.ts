// Downscale + re-encode an uploaded image to a small data URL before we embed it
// in a profile payload. Keeps request bodies tiny (avoids "Request body is too
// large") and stops huge base64 blobs from bloating every profile fetch.
// Falls back to the raw data URL if anything goes wrong.
export async function downscaleImage(file: File, max = 256, quality = 0.82): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = rawDataUrl;
    });

    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    // WebP keeps transparency (logos) and compresses well; browsers that lack it
    // return a PNG data URL, still resized.
    return canvas.toDataURL('image/webp', quality);
  } catch {
    return rawDataUrl;
  }
}
