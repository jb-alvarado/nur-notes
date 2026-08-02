export interface ListResponse<T> {
    count: number
    results: T[]
}

export interface TaxonomyItem {
    id?: number
    name?: string
    slug?: string
}

export interface Author extends TaxonomyItem {
    first_name?: string
    last_name?: string
}

export interface Locale {
    code: string
    name: string
}

export interface FacetTaxonomyItem extends TaxonomyItem {
    count: number
}

export interface FacetAuthor extends Author {
    count: number
}

export interface FacetLocale extends Locale {
    count: number
}

export interface NoteNode {
    text?: string
    ast?: unknown
    blocks?: NoteNode[]
}

export interface Note {
    id?: number
    title?: string
    slug?: string
    created_at?: string
    updated_at?: string
    category?: TaxonomyItem
    tags?: TaxonomyItem[]
    authors?: Author[]
    media?: {
        src?: string
        path?: string
        filename?: string
        alt?: string
        width?: number
        variants?: Array<{ width: number; height: number; filename: string }>
    }
    nodes?: NoteNode[]
}

export interface NoteQuery {
    limit: number
    offset: number
    ordering?: string
    search?: string
    tag?: string
    category?: string
    author?: string
    locale?: string
}

export interface FacetsResponse {
    categories: FacetTaxonomyItem[]
    tags: FacetTaxonomyItem[]
    authors: FacetAuthor[]
    locales: FacetLocale[]
}

const apiBase = (import.meta.env.VITE_NUR_CMS_URL ?? '').replace(/\/$/, '')
export const noteTypeSlug = import.meta.env.VITE_NUR_NOTE_TYPE ?? 'note'

function url(path: string, params: Record<string, string | number | undefined> = {}) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') search.set(key, String(value))
    }
    return `${apiBase}${path}?${search}`
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url(path, params), { signal })
    if (!response.ok) throw new Error(`CMS-Anfrage fehlgeschlagen (${response.status})`)
    return response.json() as Promise<T>
}

export function fetchNotes(query: NoteQuery, signal?: AbortSignal) {
    return get<ListResponse<Note>>('/api/content/entries', {
        type: noteTypeSlug,
        fields: 'id,title,slug,created_at,updated_at,media,category.name,category.slug,tags,author.first_name,author.last_name,author.slug,node.text,node.ast',
        ordering: '-created_at',
        character_limit: 420,
        blocks_limit: 1,
        ...query,
    }, signal)
}

export function fetchNote(slug: string, locale?: string, signal?: AbortSignal) {
    return get<Note>(`/api/content/entries/${encodeURIComponent(noteTypeSlug)}/${encodeURIComponent(slug)}`, {
        locale,
        fields: 'id,title,slug,created_at,updated_at,media,category.name,category.slug,tags,author.first_name,author.last_name,author.slug,node.text,node.ast',
    }, signal)
}

export function fetchFacets(query: Omit<NoteQuery, 'limit' | 'offset' | 'ordering'>, signal?: AbortSignal) {
    return get<FacetsResponse>('/api/content/entries/facets', {
        type: noteTypeSlug,
        ...query,
    }, signal)
}
