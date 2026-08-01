export interface ListResponse<T> {
    count: number
    results: T[]
}

export interface TaxonomyItem {
    id?: number
    name?: string
    slug?: string
    count?: number
}

export interface Author extends TaxonomyItem {
    first_name?: string
    last_name?: string
}

export interface Locale {
    code: string
    name: string
    count?: number
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
    categories: TaxonomyItem[]
    tags: TaxonomyItem[]
    authors: Author[]
    locales: Locale[]
}

const apiBase = (import.meta.env.VITE_NUR_CMS_URL ?? '').replace(/\/$/, '')
const noteType = import.meta.env.VITE_NUR_NOTE_TYPE ?? 'note'
export const defaultLocale = import.meta.env.VITE_NUR_LOCALE ?? 'de'

function url(path: string, params: Record<string, string | number | undefined> = {}) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') search.set(key, String(value))
    }
    return `${apiBase}${path}?${search}`
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const response = await fetch(url(path, params))
    if (!response.ok) throw new Error(`CMS-Anfrage fehlgeschlagen (${response.status})`)
    return response.json() as Promise<T>
}

export function fetchNotes(query: NoteQuery) {
    const { locale = defaultLocale, ...queryParams } = query
    return get<ListResponse<Note>>('/api/content/entries', {
        type: noteType,
        locale,
        fields: 'id,title,slug,created_at,updated_at,media,category.name,category.slug,tags,author.first_name,author.last_name,author.slug,node.text,node.ast',
        ordering: '-created_at',
        character_limit: 420,
        blocks_limit: 1,
        ...queryParams,
    })
}

export function fetchNote(slug: string, locale = defaultLocale) {
    return get<Note>(`/api/content/entries/${encodeURIComponent(noteType)}/${encodeURIComponent(slug)}`, {
        locale,
        fields: 'id,title,slug,created_at,updated_at,media,category.name,category.slug,tags,author.first_name,author.last_name,author.slug,node.text,node.ast',
    })
}

export function fetchFacets(query: Omit<NoteQuery, 'limit' | 'offset' | 'ordering'>) {
    return get<FacetsResponse>('/api/content/entries/facets', {
        type: noteType,
        ...query,
    })
}

export function fetchTags() {
    return get<ListResponse<TaxonomyItem>>('/api/content/tags', { fields: 'id,name,slug', limit: 200, ordering: 'name' })
}

export function fetchCategories(locale = defaultLocale) {
    return get<ListResponse<TaxonomyItem>>('/api/content/categories', { fields: 'id,name,slug', locale, limit: 200, ordering: 'name' })
}

export function fetchAuthors() {
    return get<ListResponse<Author>>('/api/content/authors', { fields: 'id,first_name,last_name,slug', limit: 200, ordering: 'last_name' })
}

export function fetchLocales() {
    return get<ListResponse<Locale>>('/api/locales', { fields: 'code,name', limit: 200, ordering: 'name' })
}
