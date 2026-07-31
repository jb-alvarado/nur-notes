<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    fetchAuthors,
    fetchCategories,
    fetchNote,
    fetchNotes,
    fetchTags,
    type Author,
    type Note,
    type TaxonomyItem,
} from '../api/content'
import NoteCard from '../components/NoteCard.vue'
import NoteFilters from '../components/NoteFilters.vue'
import NoteModal from '../components/NoteModal.vue'

type FilterKind = 'tag' | 'category' | 'author'

const pageSize = 18
const rowHeight = 516
const route = useRoute()
const router = useRouter()
const virtualList = ref<HTMLElement | null>(null)
const notes = ref<Note[]>([])
const tags = ref<TaxonomyItem[]>([])
const categories = ref<TaxonomyItem[]>([])
const authors = ref<Author[]>([])
const total = ref(0)
const search = ref('')
const selectedTag = ref(filterFromRoute('tag'))
const selectedCategory = ref(filterFromRoute('category'))
const selectedAuthor = ref(filterFromRoute('author'))
const isLoading = ref(true)
const isLoadingMore = ref(false)
const error = ref('')
const activeNote = ref<Note | null>(null)
const isDetailLoading = ref(false)
const detailError = ref('')
const scrollTop = ref(0)
const pageScrollY = ref(0)
const viewportHeight = ref(0)
const columnCount = ref(1)
const listTop = ref(0)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let requestVersion = 0
let resizeObserver: ResizeObserver | undefined

const showReset = computed(() =>
    Boolean(search.value || selectedTag.value || selectedCategory.value || selectedAuthor.value),
)
const hasMore = computed(() => notes.value.length < total.value)
const noteRows = computed(() => {
    const rows: Note[][] = []
    for (let index = 0; index < notes.value.length; index += columnCount.value) {
        rows.push(notes.value.slice(index, index + columnCount.value))
    }
    return rows
})
const visibleRange = computed(() => {
    const visibleRows = Math.ceil(viewportHeight.value / rowHeight) + 2
    const start = Math.max(0, Math.floor(scrollTop.value / rowHeight) - 1)
    return { start, end: Math.min(noteRows.value.length, start + visibleRows) }
})
const visibleRows = computed(() => noteRows.value.slice(visibleRange.value.start, visibleRange.value.end))
const virtualHeight = computed(() => noteRows.value.length * rowHeight)
const showScrollTop = computed(() => pageScrollY.value > 400)

function filterFromRoute(kind: FilterKind) {
    const value = route.params[kind]
    return typeof value === 'string' ? value : ''
}

function selectFilter(kind: FilterKind, slug: string) {
    selectedTag.value = kind === 'tag' ? slug : ''
    selectedCategory.value = kind === 'category' ? slug : ''
    selectedAuthor.value = kind === 'author' ? slug : ''
    void router.push(slug ? { name: `notes-${kind}`, params: { [kind]: slug } } : { name: 'notes' })
}

function syncRouteFilters() {
    selectedTag.value = filterFromRoute('tag')
    selectedCategory.value = filterFromRoute('category')
    selectedAuthor.value = filterFromRoute('author')
}

async function loadNotes(reset = false) {
    if (reset) {
        requestVersion += 1
        notes.value = []
        total.value = 0
        scrollTop.value = 0
        pageScrollY.value = 0
        window.scrollTo({ top: 0 })
        resizeObserver?.disconnect()
        resizeObserver = undefined
    } else if (isLoading.value || isLoadingMore.value || !hasMore.value) {
        return
    }

    const version = requestVersion
    if (reset) isLoading.value = true
    else isLoadingMore.value = true
    error.value = ''

    try {
        const data = await fetchNotes({
            limit: pageSize,
            offset: reset ? 0 : notes.value.length,
            search: search.value.trim(),
            tag: selectedTag.value,
            category: selectedCategory.value,
            author: selectedAuthor.value,
        })
        if (version !== requestVersion) return

        notes.value = reset ? data.results : [...notes.value, ...data.results]
        total.value = data.count
    } catch (cause) {
        if (version === requestVersion) {
            error.value =
                cause instanceof Error ? cause.message : 'Die Notizen konnten nicht geladen werden.'
        }
    } finally {
        if (version === requestVersion) {
            isLoading.value = false
            isLoadingMore.value = false
            await nextTick()
            observeVirtualList()
            updateVirtualList()
            onWindowScroll()
        }
    }
}

function loadMore() {
    void loadNotes()
}

async function loadFilters() {
    const results = await Promise.allSettled([fetchTags(), fetchCategories(), fetchAuthors()])
    if (results[0].status === 'fulfilled') tags.value = results[0].value.results
    if (results[1].status === 'fulfilled') categories.value = results[1].value.results
    if (results[2].status === 'fulfilled') authors.value = results[2].value.results
}

function submitSearch() {
    if (searchTimer) clearTimeout(searchTimer)
    void loadNotes(true)
}

function resetFilters() {
    search.value = ''
    selectedTag.value = ''
    selectedCategory.value = ''
    selectedAuthor.value = ''
    void router.push({ name: 'notes' })
}

async function openNote(note: Note) {
    if (!note.slug) {
        detailError.value = 'Diese Notiz hat keinen gültigen Slug.'
        return
    }

    isDetailLoading.value = true
    detailError.value = ''
    try {
        activeNote.value = await fetchNote(note.slug)
    } catch (cause) {
        detailError.value =
            cause instanceof Error ? cause.message : 'Die Notiz konnte nicht geladen werden.'
    } finally {
        isDetailLoading.value = false
    }
}

function closeNote() {
    activeNote.value = null
    isDetailLoading.value = false
    detailError.value = ''
}

function scheduleReload() {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => void loadNotes(true), 250)
}

function updateVirtualList() {
    const container = virtualList.value
    if (!container) return

    listTop.value = container.getBoundingClientRect().top + window.scrollY
    viewportHeight.value = window.innerHeight
    columnCount.value = Math.max(1, Math.floor((container.clientWidth + 20) / (17 * 16 + 20)))
}

function observeVirtualList() {
    if (!virtualList.value || resizeObserver) return

    resizeObserver = new ResizeObserver(updateVirtualList)
    resizeObserver.observe(virtualList.value)
}

function onWindowScroll() {
    pageScrollY.value = window.scrollY
    scrollTop.value = Math.max(0, window.scrollY - listTop.value)
    if (window.scrollY + window.innerHeight >= listTop.value + virtualHeight.value - rowHeight * 2) {
        loadMore()
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch([search, selectedTag, selectedCategory, selectedAuthor], scheduleReload)
watch(
    () => route.fullPath,
    syncRouteFilters,
)
onBeforeUnmount(() => {
    if (searchTimer) clearTimeout(searchTimer)
    resizeObserver?.disconnect()
    window.removeEventListener('scroll', onWindowScroll)
    window.removeEventListener('resize', updateVirtualList)
})
onMounted(async () => {
    await nextTick()
    updateVirtualList()
    observeVirtualList()
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    window.addEventListener('resize', updateVirtualList)
    void Promise.all([loadNotes(true), loadFilters()])
})
</script>

<template>
    <main class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <section class="mb-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
                <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Zitat- und Gedankensammlung</h1>
            </div>
            <p class="text-sm text-base-content/60">
                <span class="font-semibold text-base-content">{{ total }}</span> Notizen gefunden
            </p>
        </section>

        <NoteFilters
            :tag="selectedTag"
            :category="selectedCategory"
            :author="selectedAuthor"
            :search="search"
            :tags="tags"
            :categories="categories"
            :authors="authors"
            :show-reset="showReset"
            @search="search = $event"
            @update:tag="selectFilter('tag', $event)"
            @update:category="selectFilter('category', $event)"
            @update:author="selectFilter('author', $event)"
            @submit="submitSearch"
            @reset="resetFilters"
        />

        <div v-if="error" role="alert" class="alert alert-error mb-8">
            <span>{{ error }}</span><button class="btn btn-sm" @click="loadNotes(true)">Erneut versuchen</button>
        </div>
        <div v-if="isLoading" class="note-grid grid gap-5">
            <div v-for="item in pageSize" :key="item" class="h-72 animate-pulse rounded-2xl bg-base-300"></div>
        </div>
        <div
            v-else-if="notes.length"
            ref="virtualList"
        >
            <div class="relative" :style="{ height: `${virtualHeight}px` }">
                <div :style="{ transform: `translateY(${visibleRange.start * rowHeight}px)` }">
                    <div
                        v-for="(row, index) in visibleRows"
                        :key="visibleRange.start + index"
                        class="grid h-124 gap-x-5 mb-5"
                        :style="{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }"
                    >
                        <NoteCard v-for="note in row" :key="note.id" :note="note" @select="openNote" />
                    </div>
                </div>
            </div>
            <div v-if="isLoadingMore" class="py-4 text-center text-sm text-base-content/60">Weitere Notizen werden geladen …</div>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
            <p class="text-lg font-semibold">Keine Notizen gefunden</p>
            <p class="mt-1 text-base-content/60">Passe deine Suche oder Filter an.</p>
            <button class="btn btn-ghost btn-sm mt-4" @click="resetFilters">Filter zurücksetzen</button>
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
        <NoteModal :note="activeNote" :is-loading="isDetailLoading" :error="detailError" @close="closeNote" />
    </main>
</template>
