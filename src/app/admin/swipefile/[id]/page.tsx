import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { SwipeFolderView } from '@/components/swipefile/SwipeFolderView'

export default async function SwipeFolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const folder = await db.swipeFolder.findFirst({
    where: { id, userId: session!.user!.id! },
    include: {
      cards: { orderBy: { createdAt: 'asc' } },
      links: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!folder) notFound()

  return (
    <SwipeFolderView
      folder={{
        id: folder.id,
        name: folder.name,
        color: folder.color,
      }}
      initialCards={folder.cards.map(c => ({
        id: c.id, type: c.type as 'NOTE' | 'IMAGE', content: c.content, color: c.color,
        x: c.x, y: c.y, w: c.w, h: c.h, zIndex: c.zIndex,
      }))}
      initialLinks={folder.links.map(l => ({
        id: l.id, url: l.url, title: l.title, note: l.note, createdAt: l.createdAt.toISOString(),
      }))}
    />
  )
}
