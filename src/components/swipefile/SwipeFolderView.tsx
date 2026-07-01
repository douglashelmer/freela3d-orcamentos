'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SwipeCanvas, type SwipeCardData } from './SwipeCanvas'
import { SwipeLinks, type SwipeLinkData } from './SwipeLinks'

type Folder = { id: string; name: string; color: string | null }

export function SwipeFolderView({
  folder,
  initialCards,
  initialLinks,
}: {
  folder: Folder
  initialCards: SwipeCardData[]
  initialLinks: SwipeLinkData[]
}) {
  const [tab, setTab] = useState<'canvas' | 'links'>('canvas')

  return (
    <div className="flex flex-col h-full" style={{ background: '#1E1E1E' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-8 py-4 border-b shrink-0" style={{ borderColor: '#2a2a2a' }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/swipefile"
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-[#aaa] hover:text-white transition-colors"
            style={{ background: '#252525' }}
          >
            ←
          </Link>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ background: `${folder.color ?? '#D5FF40'}22`, color: folder.color ?? '#D5FF40' }}
          >
            📁
          </div>
          <h1 className="text-lg font-bold text-white truncate">{folder.name}</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl shrink-0" style={{ background: '#252525' }}>
          <button
            onClick={() => setTab('canvas')}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={tab === 'canvas' ? { background: '#D5FF40', color: '#1E1E1E' } : { color: '#888' }}
          >
            Canvas
          </button>
          <button
            onClick={() => setTab('links')}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={tab === 'links' ? { background: '#D5FF40', color: '#1E1E1E' } : { color: '#888' }}
          >
            Links
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === 'canvas' ? (
          <SwipeCanvas folderId={folder.id} initialCards={initialCards} />
        ) : (
          <SwipeLinks folderId={folder.id} initialLinks={initialLinks} />
        )}
      </div>
    </div>
  )
}
