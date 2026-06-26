import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const src = join(root, 'public', 'icone-freela.png')

const sizes = [192, 512]
for (const size of sizes) {
  await sharp(src)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(join(root, 'public', `icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}
