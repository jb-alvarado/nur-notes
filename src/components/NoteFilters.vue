<script setup lang="ts">
import type { FacetAuthor, FacetLocale, FacetTaxonomyItem } from '../api/content'
import { authorName } from '../utils/note'

const props = defineProps<{
    search: string
    tags: FacetTaxonomyItem[]
    categories: FacetTaxonomyItem[]
    authors: FacetAuthor[]
    locales: FacetLocale[]
    locale: string
    showReset: boolean
    tag: string
    category: string
    author: string
    sortField: string
    sortDirection: 'asc' | 'desc'
}>()

const emit = defineEmits<{
    search: [value: string]
    'update:tag': [value: string]
    'update:category': [value: string]
    'update:author': [value: string]
    'update:locale': [value: string]
    reset: []
    'update:sortField': [value: string]
    'update:sortDirection': [value: 'asc' | 'desc']
    submit: []
}>()

function toggleSortDirection() {
    emit('update:sortDirection', props.sortDirection === 'asc' ? 'desc' : 'asc')
}
</script>

<template>
    <section class="mb-6 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <form class="flex gap-2" @submit.prevent="$emit('submit')">
            <label class="input input-bordered flex flex-1 items-center gap-2">
                <svg
                    viewBox="0 0 24 24"
                    class="size-5 shrink-0 fill-none stroke-current opacity-50"
                    stroke-width="2"
                >
                    <circle cx="11" cy="11" r="6" />
                    <path d="m20 20-4.2-4.2" />
                </svg>
                <input
                    :value="search"
                    type="search"
                    class="grow"
                    placeholder="Notizen durchsuchen …"
                    aria-label="Notizen durchsuchen"
                    @input="emit('search', ($event.target as HTMLInputElement).value)"
                />
                <button
                    v-if="search"
                    type="button"
                    class="btn btn-ghost btn-xs btn-circle text-xl"
                    aria-label="Suche zurücksetzen"
                    @click="emit('search', '')"
                >
                    ✕
                </button>
            </label>
            <select
                :value="sortField"
                class="select select-bordered hidden w-44 lg:block"
                aria-label="Sortieren nach"
                @change="emit('update:sortField', ($event.target as HTMLSelectElement).value)"
            >
                <option value="created_at">Erstelldatum</option>
                <option value="title">Titel</option>
                <option value="author.last_name">Autor</option>
            </select>
            <button
                type="button"
                class="btn btn-square hidden lg:flex"
                :aria-label="
                    sortDirection === 'asc' ? 'Aufsteigend sortiert' : 'Absteigend sortiert'
                "
                :title="sortDirection === 'asc' ? 'Aufsteigend sortiert' : 'Absteigend sortiert'"
                @click="toggleSortDirection"
            >
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </button>
        </form>
        <div
            class="mt-2 flex flex-wrap items-center gap-2 lg:grid lg:grid-cols-[repeat(3,minmax(0,1fr))_10rem_auto]"
        >
            <select
                :value="category"
                class="select select-bordered select-sm w-full lg:w-full"
                aria-label="Kategorie filtern"
                @change="emit('update:category', ($event.target as HTMLSelectElement).value)"
            >
                <option value="">Alle Kategorien</option>
                <option v-for="item in categories" :key="item.slug" :value="item.slug">
                    {{ item.name }} ({{ item.count }})
                </option>
            </select>
            <select
                :value="tag"
                class="select select-bordered select-sm w-full lg:w-full"
                aria-label="Tag filtern"
                @change="emit('update:tag', ($event.target as HTMLSelectElement).value)"
            >
                <option value="">Alle Tags</option>
                <option v-for="item in tags" :key="item.slug" :value="item.slug">
                    {{ item.name }} ({{ item.count }})
                </option>
            </select>
            <select
                :value="author"
                class="select select-bordered select-sm w-full lg:w-full"
                aria-label="Autor filtern"
                @change="emit('update:author', ($event.target as HTMLSelectElement).value)"
            >
                <option value="">Alle Autoren</option>
                <option v-for="item in authors" :key="item.slug" :value="item.slug">
                    {{ authorName(item) }} ({{ item.count }})
                </option>
            </select>
            <select
                :value="locale"
                class="select select-bordered select-sm w-full lg:w-full"
                aria-label="Sprache auswählen"
                @change="emit('update:locale', ($event.target as HTMLSelectElement).value)"
            >
                <option value="">Alle Sprachen</option>
                <option v-for="item in locales" :key="item.code" :value="item.code">
                    {{ item.name || item.code.toUpperCase() }} ({{ item.count }})
                </option>
            </select>
            <button
                v-if="showReset"
                type="button"
                class="btn btn-ghost btn-square btn-sm"
                aria-label="Filter zurücksetzen"
                title="Filter zurücksetzen"
                @click="emit('reset')"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-arrow-counterclockwise"
                    viewBox="0 0 16 16"
                >
                    <path
                        fill-rule="evenodd"
                        d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"
                    />
                    <path
                        d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"
                    />
                </svg>
            </button>
        </div>
        <div class="mt-2 flex gap-2 lg:hidden">
            <select
                :value="sortField"
                class="select select-bordered select-sm grow"
                aria-label="Sortieren nach"
                @change="emit('update:sortField', ($event.target as HTMLSelectElement).value)"
            >
                <option value="created_at">Erstelldatum</option>
                <option value="title">Titel</option>
                <option value="author.last_name">Autor</option>
            </select>
            <button
                type="button"
                class="btn btn-square btn-sm"
                :aria-label="
                    sortDirection === 'asc' ? 'Aufsteigend sortiert' : 'Absteigend sortiert'
                "
                :title="sortDirection === 'asc' ? 'Aufsteigend sortiert' : 'Absteigend sortiert'"
                @click="toggleSortDirection"
            >
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </button>
        </div>
    </section>
</template>
