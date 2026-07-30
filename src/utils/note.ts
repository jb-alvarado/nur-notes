import type { Author, Note, NoteNode } from '../api/content'

export function authorName(author?: Author) {
    return [author?.first_name, author?.last_name].filter(Boolean).join(' ') || author?.slug || 'Unbekannt'
}

export function formatDate(value?: string) {
    return value ? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : ''
}

function extractAstText(value?: unknown, characterCount?: number): string {
    const nodes = Array.isArray(value) ? value : value && typeof value === 'object' ? [value] : []
    const fullText = nodes
        .map((value) => {
            const node = value as Record<string, unknown>
            const text = typeof node.text === 'string' ? node.text : ''
            const childrenText = extractAstText(node.children)
            return `${text}${childrenText}`
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

    if (!characterCount || characterCount <= 0 || fullText.length <= characterCount) return fullText

    let truncated = ''
    for (const word of fullText.split(' ')) {
        const candidate = truncated ? `${truncated} ${word}` : word
        if (candidate.length > characterCount) break
        truncated = candidate
    }

    return truncated ? `${truncated} ...` : '...'
}

function nodeText(node: NoteNode): string {
    if (node.blocks) return node.blocks.map((block) => nodeText(block)).join(' ')
    return node.text || extractAstText(node.ast)
}

export function noteExcerpt(note: Note, maxLength = 280) {
    const node = note.nodes?.[0]
    const text = node ? nodeText(node) : ''
    const excerpt = text.replace(/\s+/g, ' ').trim() || 'Keine Vorschau für diese Notiz vorhanden.'

    if (excerpt.length <= maxLength) return excerpt

    // Nicht mitten in einem Wort abschneiden: bis zum letzten vollständigen Wort zurückgehen.
    const shortened = excerpt.slice(0, maxLength + 1).replace(/\s+\S*$/, '').trimEnd()
    return `${shortened || excerpt.slice(0, maxLength).trimEnd()}…`
}

export function noteText(note: Note) {
    const text = note.nodes
        ?.map(nodeText)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

    return text || 'Für diese Notiz ist kein Text vorhanden.'
}

function mediaUrl(path?: string, filename?: string) {
    if (!path || !filename) return ''
    return `${path.replace(/\/$/, '')}/${filename}`
}

export function noteImage(note: Note) {
    const media = note.media
    if (!media) return null

    const variants = [...(media.variants ?? [])].sort((a, b) => a.width - b.width)
    const sources = variants
        .map((variant) => ({ width: variant.width, url: mediaUrl(media.path, variant.filename) }))
        .filter((source) => source.url)

    const originalUrl = media.src || mediaUrl(media.path, media.filename)
    if (originalUrl && media.width && !sources.some((source) => source.width === media.width)) {
        sources.push({ width: media.width, url: originalUrl })
    }

    const fallback = sources[0]?.url || originalUrl
    if (!fallback) return null

    return {
        src: fallback,
        srcset: sources.map((source) => `${source.url} ${source.width}w`).join(', '),
        sizes: '(min-width: 1280px) 18rem, (min-width: 1024px) calc((100vw - 5rem) / 3), (min-width: 640px) calc((100vw - 4rem) / 2), calc(100vw - 2rem)',
        alt: media.alt || note.title || '',
    }
}
