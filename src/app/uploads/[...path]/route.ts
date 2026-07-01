import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// Next.js (Turbopack production build) does not serve files written to
// `public/` after the server has started — it relies on a build-time
// manifest. User uploads are written at runtime, so they need a route
// handler that reads the file from disk on every request instead.
const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const filePath = path.join(uploadDir, ...segments)

  // Prevent path traversal outside the uploads directory
  if (!filePath.startsWith(uploadDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const file = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
