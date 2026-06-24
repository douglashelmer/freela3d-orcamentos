import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

// Conversão WebP só é aplicada quando o cliente envia o campo `webp` no form
// (hoje: upload de imagem das Tarefas). Logo e imagens de orçamento continuam intactos.
const MAX_DIM = 1600
const WEBP_QUALITY = 80
// formatos raster que vale converter; SVG (vetor) e GIF (animação) ficam intactos
const CONVERTIBLE = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff', 'image/avif', 'image/bmp']

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const files = form.getAll('files') as File[]
  const toWebp = !!form.get('webp')
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const urls: string[] = []
  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (toWebp && CONVERTIBLE.includes(file.type)) {
      try {
        const webp = await sharp(buffer)
          .rotate() // respeita orientação EXIF
          .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer()
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
        await writeFile(path.join(uploadDir, name), webp)
        urls.push(`/uploads/${name}`)
        continue
      } catch {
        // se a conversão falhar, cai pro fluxo padrão (salva o original)
      }
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await writeFile(path.join(uploadDir, name), buffer)
    urls.push(`/uploads/${name}`)
  }

  return NextResponse.json({ urls })
}
