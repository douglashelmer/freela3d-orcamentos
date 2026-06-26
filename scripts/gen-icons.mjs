import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Read the SVG logo
const svg = readFileSync(join(root, 'public', 'icon.svg'))

const sizes = [192, 512]
for (const size of sizes) {
  await sharp(svg)
    .resize(size, size, { fit: 'contain', background: { r: 30, g: 30, b: 30, alpha: 1 } })
    .png()
    .toFile(join(root, 'public', `icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}
