<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    fetchFacets,
    fetchNote,
    fetchNotes,
    type FacetAuthor,
    type FacetLocale,
    type FacetTaxonomyItem,
    type Note,
} from '../api/content'
import NoteCard from '../components/NoteCard.vue'
import NoteFilters from '../components/NoteFilters.vue'
import NoteModal from '../components/NoteModal.vue'

type FilterKind = 'tag' | 'category' | 'author'
type SortField = 'created_at' | 'title' | 'author.last_name'
type QueryKey = FilterKind | 'locale' | 'search' | 'sort' | 'direction'

const pageSize = 18
const route = useRoute()
const router = useRouter()
const notes = ref<Note[]>([])
const tags = ref<FacetTaxonomyItem[]>([])
const categories = ref<FacetTaxonomyItem[]>([])
const authors = ref<FacetAuthor[]>([])
const total = ref(0)
const search = ref(filterFromQuery('search'))
const selectedTag = ref(filterFromQuery('tag'))
const selectedCategory = ref(filterFromQuery('category'))
const selectedAuthor = ref(filterFromQuery('author'))
const selectedLocale = ref(filterFromQuery('locale'))
const locales = ref<FacetLocale[]>([])
const sortField = ref<SortField>(sortFieldFromQuery())
const sortDirection = ref<'asc' | 'desc'>(sortDirectionFromQuery())
const isLoading = ref(true)
const isLoadingMore = ref(false)
const hasLoaded = ref(false)
const error = ref('')
const activeNote = ref<Note | null>(null)
const isDetailLoading = ref(false)
const detailError = ref('')
const pageScrollY = ref(0)
const facetError = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined
let requestVersion = 0
let facetRequestVersion = 0
let notesController: AbortController | undefined
let facetsController: AbortController | undefined
let detailController: AbortController | undefined

const ordering = computed(() => `${sortField.value} ${sortDirection.value.toUpperCase()}`)
const showReset = computed(() =>
    Boolean(
        search.value ||
        selectedTag.value ||
        selectedCategory.value ||
        selectedAuthor.value ||
        selectedLocale.value ||
        sortField.value !== 'created_at' ||
        sortDirection.value !== 'desc',
    ),
)
const hasMore = computed(() => notes.value.length < total.value)
const showScrollTop = computed(() => pageScrollY.value > 400)

function filterFromQuery(kind: QueryKey) {
    const value = route.query[kind]
    return typeof value === 'string' ? value : ''
}

function sortFieldFromQuery(): SortField {
    const field = filterFromQuery('sort')
    return field === 'title' || field === 'author.last_name' ? field : 'created_at'
}

function sortDirectionFromQuery(): 'asc' | 'desc' {
    return filterFromQuery('direction') === 'asc' ? 'asc' : 'desc'
}

function selectFilter(kind: FilterKind, slug: string) {
    if (kind === 'tag') selectedTag.value = slug
    if (kind === 'category') selectedCategory.value = slug
    if (kind === 'author') selectedAuthor.value = slug
}

function selectLocale(locale: string) {
    selectedLocale.value = locale
}

function syncFilterQuery() {
    const query = Object.fromEntries(
        Object.entries({
            category: selectedCategory.value,
            tag: selectedTag.value,
            author: selectedAuthor.value,
            locale: selectedLocale.value,
            search: search.value.trim(),
            sort: sortField.value === 'created_at' ? '' : sortField.value,
            direction: sortDirection.value === 'desc' ? '' : sortDirection.value,
        }).filter(([, value]) => value),
    )
    void router.replace({ name: 'notes', query })
}

function syncRouteFilters() {
    const nextTag = filterFromQuery('tag')
    const nextCategory = filterFromQuery('category')
    const nextAuthor = filterFromQuery('author')
    const nextLocale = filterFromQuery('locale')
    const nextSearch = filterFromQuery('search')
    const nextSortField = sortFieldFromQuery()
    const nextSortDirection = sortDirectionFromQuery()

    const isCurrentState =
        selectedTag.value === nextTag &&
        selectedCategory.value === nextCategory &&
        selectedAuthor.value === nextAuthor &&
        selectedLocale.value === nextLocale &&
        search.value === nextSearch &&
        sortField.value === nextSortField &&
        sortDirection.value === nextSortDirection

    if (isCurrentState) return

    selectedTag.value = nextTag
    selectedCategory.value = nextCategory
    selectedAuthor.value = nextAuthor
    selectedLocale.value = nextLocale
    search.value = nextSearch
    sortField.value = nextSortField
    sortDirection.value = nextSortDirection
}

async function loadNotes(reset = false) {
    if (reset) {
        notesController?.abort()
        requestVersion += 1
        notes.value = []
        total.value = 0
        hasLoaded.value = false
        pageScrollY.value = 0
        window.scrollTo({ top: 0 })
    } else if (isLoading.value || isLoadingMore.value || !hasMore.value) {
        return
    }

    const version = requestVersion
    const controller = new AbortController()
    notesController = controller
    if (reset) isLoading.value = true
    else isLoadingMore.value = true
    error.value = ''

    try {
        const data = await fetchNotes(
            {
                limit: pageSize,
                offset: reset ? 0 : notes.value.length,
                ordering: ordering.value,
                search: search.value.trim(),
                tag: selectedTag.value,
                category: selectedCategory.value,
                author: selectedAuthor.value,
                locale: selectedLocale.value,
            },
            controller.signal,
        )
        if (version !== requestVersion) return

        notes.value = reset ? data.results : [...notes.value, ...data.results]
        total.value = data.count
        hasLoaded.value = true
    } catch (cause) {
        if (version === requestVersion && cause instanceof Error && cause.name !== 'AbortError') {
            error.value =
                cause instanceof Error ? cause.message : 'Die Notizen konnten nicht geladen werden.'
        }
    } finally {
        if (version === requestVersion) {
            isLoading.value = false
            isLoadingMore.value = false
        }
    }
}

function loadMore() {
    void loadNotes()
}

async function loadFilters() {
    facetsController?.abort()
    const version = ++facetRequestVersion
    const controller = new AbortController()
    facetsController = controller
    facetError.value = ''
    try {
        const facets = await fetchFacets(
            {
                search: search.value.trim(),
                tag: selectedTag.value,
                category: selectedCategory.value,
                author: selectedAuthor.value,
                locale: selectedLocale.value,
            },
            controller.signal,
        )
        if (version !== facetRequestVersion) return

        tags.value = facets.tags
        categories.value = facets.categories
        authors.value = facets.authors
        locales.value = facets.locales
    } catch (cause) {
        if (
            version === facetRequestVersion &&
            cause instanceof Error &&
            cause.name !== 'AbortError'
        ) {
            facetError.value = 'Filteroptionen konnten nicht aktualisiert werden.'
        }
    }
}

function submitSearch() {
    if (searchTimer) clearTimeout(searchTimer)
    reloadData()
}

function resetFilters() {
    search.value = ''
    selectedTag.value = ''
    selectedCategory.value = ''
    selectedAuthor.value = ''
    selectedLocale.value = ''
    sortField.value = 'created_at'
    sortDirection.value = 'desc'
}

async function openNote(note: Note) {
    if (!note.slug) {
        detailError.value = 'Diese Notiz hat keinen gültigen Slug.'
        return
    }

    detailController?.abort()
    const controller = new AbortController()
    detailController = controller
    isDetailLoading.value = true
    detailError.value = ''
    try {
        activeNote.value = await fetchNote(note.slug, selectedLocale.value, controller.signal)
    } catch (cause) {
        if (cause instanceof Error && cause.name === 'AbortError') return
        detailError.value =
            cause instanceof Error ? cause.message : 'Die Notiz konnte nicht geladen werden.'
    } finally {
        isDetailLoading.value = false
    }
}

function closeNote() {
    detailController?.abort()
    activeNote.value = null
    isDetailLoading.value = false
    detailError.value = ''
}

function reloadData() {
    void Promise.all([loadNotes(true), loadFilters()])
}

function scheduleReload() {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(reloadData, 250)
}

function onWindowScroll() {
    pageScrollY.value = window.scrollY
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 600) {
        loadMore()
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function reloadAfterNoteCreated() {
    reloadData()
}

watch(
    [
        search,
        selectedTag,
        selectedCategory,
        selectedAuthor,
        selectedLocale,
        sortField,
        sortDirection,
    ],
    () => {
        syncFilterQuery()
        scheduleReload()
    },
)
watch(
    () => route.fullPath,
    syncRouteFilters,
)
onBeforeUnmount(() => {
    if (searchTimer) clearTimeout(searchTimer)
    notesController?.abort()
    facetsController?.abort()
    detailController?.abort()
    window.removeEventListener('scroll', onWindowScroll)
    window.removeEventListener('notes:created', reloadAfterNoteCreated)
})
onMounted(() => {
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    window.addEventListener('notes:created', reloadAfterNoteCreated)
    reloadData()
})
</script>

<template>
    <main class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <section class="mb-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
                <h1 class="text-2xl lg:text-3xl font-bold tracking-tight sm:text-4xl">
                    Zitate & Gedanken
                </h1>
            </div>
            <p class="text-sm text-base-content/60">
                <span class="font-semibold text-base-content">{{ total }}</span> Notizen gefunden
            </p>
        </section>

        <NoteFilters
            :tag="selectedTag"
            :category="selectedCategory"
            :author="selectedAuthor"
            :sort-field="sortField"
            :sort-direction="sortDirection"
            :search="search"
            :tags="tags"
            :categories="categories"
            :authors="authors"
            :locales="locales"
            :locale="selectedLocale"
            :show-reset="showReset"
            @search="search = $event"
            @update:tag="selectFilter('tag', $event)"
            @update:category="selectFilter('category', $event)"
            @update:author="selectFilter('author', $event)"
            @update:locale="selectLocale"
            @reset="resetFilters"
            @update:sort-field="sortField = $event as SortField"
            @update:sort-direction="sortDirection = $event"
            @submit="submitSearch"
        />

        <div v-if="error" role="alert" class="alert alert-error mb-8">
            <span>{{ error }}</span
            ><button class="btn btn-sm" @click="loadNotes(true)">Erneut versuchen</button>
        </div>
        <div v-if="facetError" role="alert" class="alert alert-warning mb-8">
            <span>{{ facetError }}</span
            ><button class="btn btn-sm" @click="loadFilters">Erneut versuchen</button>
        </div>
        <template v-if="isLoading">
            <div class="note-grid grid gap-5">
                <div
                    v-for="item in pageSize"
                    :key="item"
                    class="h-72 animate-pulse rounded-2xl bg-base-300"
                ></div>
            </div>
        </template>
        <template v-else-if="notes.length">
            <div class="note-grid grid gap-5">
                <NoteCard v-for="note in notes" :key="note.id" :note="note" @select="openNote" />
            </div>
            <div v-if="isLoadingMore" class="py-4 text-center text-sm text-base-content/60">
                Weitere Notizen werden geladen …
            </div>
        </template>
        <div
            v-else-if="hasLoaded"
            class="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center"
        >
            <p class="text-lg font-semibold">Keine Notizen gefunden</p>
            <p class="mt-1 text-base-content/60">Passe deine Suche oder Filter an.</p>
        </div>
        <button
            v-if="showScrollTop"
            class="btn btn-primary btn-circle fixed right-5 bottom-5 z-20 shadow-lg"
            type="button"
            aria-label="Zum Anfang der Liste"
            @click="scrollToTop"
        >
            ↑
        </button>
        <NoteModal
            :note="activeNote"
            :is-loading="isDetailLoading"
            :error="detailError"
            @close="closeNote"
        />
    </main>
</template>
