import { it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
it('las imágenes de la web clásica migradas no conservan EXIF, GPS ni XMP', async () => {
  const archivos = fs.readdirSync('public', { recursive: true }).map(String).filter(p => /\.(png|jpe?g|webp)$/i.test(p));
  expect(archivos.length).toBeGreaterThan(20);
  for (const archivo of archivos) {
    const meta = await sharp(path.join('public', archivo)).metadata();
    expect(meta.exif, archivo).toBeUndefined();
    expect(meta.xmp, archivo).toBeUndefined();
    expect(meta.iptc, archivo).toBeUndefined();
  }
});
