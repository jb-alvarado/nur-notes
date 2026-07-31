<script setup lang="ts">
import type { Author, TaxonomyItem } from '../api/content'
import { authorName } from '../utils/note'

const props = defineProps<{
    search: string
    tags: TaxonomyItem[]
    categories: TaxonomyItem[]
    authors: Author[]
    tag: string
    category: string
    author: string
    sortField: string
    sortDirection: 'asc' | 'desc'
    showReset: boolean
}>()

const emit = defineEmits<{
    search: [value: string]
    'update:tag': [value: string]
    'update:category': [value: string]
    'update:author': [value: string]
    'update:sortField': [value: string]
    'update:sortDirection': [value: 'asc' | 'desc']
    submit: []
    reset: []
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
                :aria-label="sortDirection === 'asc' ? 'Aufsteigend sortiert' : 'Absteigend sortiert'"
                :title="sortDirection === 'asc' ? 'Aufsteigend sortiert' : 'Absteigend sortiert'"
                @click="toggleSortDirection"
            >
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </button>
        </form>
        <div class="mt-2 flex flex-wrap items-center gap-2 lg:grid lg:grid-cols-3">
            <select
                :value="category"
                class="select select-bordered select-sm w-full lg:w-full"
                aria-label="Kategorie filtern"
                @change="emit('update:category', ($event.target as HTMLSelectElement).value)"
            >
                <option value="">Alle Kategorien</option>
                <option v-for="item in categories" :key="item.slug" :value="item.slug">
                    {{ item.name }}
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
                    {{ item.name }}
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
                    {{ authorName(item) }}
                </option>
            </select>
            <button v-if="showReset" class="btn btn-ghost btn-sm lg:col-span-3 lg:justify-self-start" @click="$emit('reset')">
                Zurücksetzen
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
                :aria-label="sortDirection === 'asc' ? 'Aufsteigend sortiert' : 'Absteigend sortiert'"
                :title="sortDirection === 'asc' ? 'Aufsteigend sortiert' : 'Absteigend sortiert'"
                @click="toggleSortDirection"
            >
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </button>
        </div>
    </section>
</template>
