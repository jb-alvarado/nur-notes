<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchAuthors, fetchCategories, fetchNote, fetchNotes, fetchTags, type Author, type Note, type TaxonomyItem } from '../api/content'
import AppPagination from '../components/AppPagination.vue'
import NoteCard from '../components/NoteCard.vue'
import NoteFilters from '../components/NoteFilters.vue'
import NoteModal from '../components/NoteModal.vue'

const pageSize = 12
const notes = ref<Note[]>([])
const tags = ref<TaxonomyItem[]>([])
const categories = ref<TaxonomyItem[]>([])
const authors = ref<Author[]>([])
const total = ref(0)
const page = ref(1)
const search = ref('')
const submittedSearch = ref('')
const selectedTag = ref('')
const selectedCategory = ref('')
const selectedAuthor = ref('')
const isLoading = ref(true)
const error = ref('')
const activeNote = ref<Note | null>(null)
const isDetailLoading = ref(false)
const detailError = ref('')

const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const pageList = computed(() => {
    const start = Math.max(1, Math.min(page.value - 2, pages.value - 4))
    return Array.from({ length: Math.min(5, pages.value - start + 1) }, (_, index) => start + index)
})
const showReset = computed(() => Boolean(submittedSearch.value || selectedTag.value || selectedCategory.value || selectedAuthor.value))

async function loadNotes() {
    isLoading.value = true
    error.value = ''
    try {
        const data = await fetchNotes({
            limit: pageSize,
            offset: (page.value - 1) * pageSize,
            search: submittedSearch.value,
            tag: selectedTag.value,
            category: selectedCategory.value,
            author: selectedAuthor.value,
        })
        notes.value = data.results
        total.value = data.count
        if (page.value > pages.value) page.value = pages.value
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Die Notizen konnten nicht geladen werden.'
    } finally {
        isLoading.value = false
    }
}

async function loadFilters() {
    const results = await Promise.allSettled([fetchTags(), fetchCategories(), fetchAuthors()])
    if (results[0].status === 'fulfilled') tags.value = results[0].value.results
    if (results[1].status === 'fulfilled') categories.value = results[1].value.results
    if (results[2].status === 'fulfilled') authors.value = results[2].value.results
}

function submitSearch() {
    submittedSearch.value = search.value.trim()
    page.value = 1
}

function resetFilters() {
    search.value = ''
    submittedSearch.value = ''
    selectedTag.value = ''
    selectedCategory.value = ''
    selectedAuthor.value = ''
    page.value = 1
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
        detailError.value = cause instanceof Error ? cause.message : 'Die Notiz konnte nicht geladen werden.'
    } finally {
        isDetailLoading.value = false
    }
}

function closeNote() {
    activeNote.value = null
    isDetailLoading.value = false
    detailError.value = ''
}

watch([page, selectedTag, selectedCategory, selectedAuthor], loadNotes)
onMounted(() => void Promise.all([loadNotes(), loadFilters()]))
</script>

<template>
    <main class="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <section class="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p class="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Wissenssammlung</p><h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Deine Notizen, klar sortiert.</h1><p class="mt-2 text-base-content/60">Durchsuche und entdecke alles, was wichtig ist.</p></div>
            <p class="text-sm text-base-content/60"><span class="font-semibold text-base-content">{{ total }}</span> Notizen gefunden</p>
        </section>

        <NoteFilters v-model:tag="selectedTag" v-model:category="selectedCategory" v-model:author="selectedAuthor" :search="search" :tags="tags" :categories="categories" :authors="authors" :show-reset="showReset" @search="search = $event" @submit="submitSearch" @reset="resetFilters" />

        <div v-if="error" role="alert" class="alert alert-error mb-8"><span>{{ error }}</span><button class="btn btn-sm" @click="loadNotes">Erneut versuchen</button></div>
        <div v-if="isLoading" class="note-grid grid gap-5"><div v-for="item in pageSize" :key="item" class="h-72 animate-pulse rounded-2xl bg-base-300"></div></div>
        <div v-else-if="notes.length" class="note-grid grid gap-5"><NoteCard v-for="note in notes" :key="note.id" :note="note" @select="openNote" /></div>
        <div v-else class="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center"><p class="text-lg font-semibold">Keine Notizen gefunden</p><p class="mt-1 text-base-content/60">Passe deine Suche oder Filter an.</p><button class="btn btn-ghost btn-sm mt-4" @click="resetFilters">Filter zurücksetzen</button></div>
        <AppPagination v-if="!isLoading" :page="page" :pages="pages" :page-list="pageList" @change="page = $event" />
        <NoteModal :note="activeNote" :is-loading="isDetailLoading" :error="detailError" @close="closeNote" />
    </main>
</template>
