import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const source = process.argv[2];
if (!source || !fs.existsSync(source)) {
  throw new Error('Usage: node scripts/prepare-photos.mjs "path/to/photo-folder"');
}

const files = fs.readdirSync(source).filter((name) => /\.(jpe?g|png|webp)$/i.test(name) && name !== 'IMG_4961 (1).JPG');
const output = path.join(process.cwd(), 'public', 'photos');
fs.mkdirSync(output, { recursive: true });

const tiles = [];
for (let index = 0; index < files.length; index++) {
  const file = files[index];
  const name = `wedding-${String(index + 1).padStart(2, '0')}.webp`;
  const inputPath = path.join(source, file);
  const result = await sharp(inputPath).rotate().resize({ width: 1800, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(path.join(output, name));
  console.log(`${name} <- ${file}: ${Math.round(result.size / 1024)} KB`);
  const thumb = await sharp(inputPath).rotate().resize(180, 230, { fit: 'cover' }).webp({ quality: 75 }).toBuffer();
  tiles.push({ input: thumb, left: (index % 4) * 190 + 5, top: Math.floor(index / 4) * 270 + 5 });
}
const rows = Math.ceil(files.length / 4);
await sharp({ create: { width: 760, height: rows * 270, channels: 4, background: '#f8f2e9' } }).composite(tiles).webp().toFile(path.join(process.cwd(), 'photo-contact-sheet.webp'));
