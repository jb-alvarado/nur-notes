<script setup lang="ts">
import type { Author, TaxonomyItem } from '../api/content'
import { authorName } from '../utils/note'

defineProps<{
    search: string
    tags: TaxonomyItem[]
    categories: TaxonomyItem[]
    authors: Author[]
    tag: string
    category: string
    author: string
    showReset: boolean
}>()

const emit = defineEmits<{
    search: [value: string]
    'update:tag': [value: string]
    'update:category': [value: string]
    'update:author': [value: string]
    submit: []
    reset: []
}>()
</script>

<template>
    <section class="mb-8 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
        <form class="flex gap-2" @submit.prevent="$emit('submit')">
            <label class="input input-bordered flex flex-1 items-center gap-2">
                <svg viewBox="0 0 24 24" class="size-5 shrink-0 fill-none stroke-current opacity-50" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/></svg>
                <input :value="search" type="search" class="grow" placeholder="Notizen durchsuchen …" aria-label="Notizen durchsuchen" @input="emit('search', ($event.target as HTMLInputElement).value)" />
            </label>
            <button class="btn btn-primary" type="submit">Suchen</button>
        </form>
        <div class="mt-4 flex flex-wrap items-center gap-2">
            <select :value="category" class="select select-bordered select-sm min-w-36" aria-label="Kategorie filtern" @change="emit('update:category', ($event.target as HTMLSelectElement).value)"><option value="">Alle Kategorien</option><option v-for="item in categories" :key="item.slug" :value="item.slug">{{ item.name }}</option></select>
            <select :value="tag" class="select select-bordered select-sm min-w-32" aria-label="Tag filtern" @change="emit('update:tag', ($event.target as HTMLSelectElement).value)"><option value="">Alle Tags</option><option v-for="item in tags" :key="item.slug" :value="item.slug">{{ item.name }}</option></select>
            <select :value="author" class="select select-bordered select-sm min-w-36" aria-label="Autor filtern" @change="emit('update:author', ($event.target as HTMLSelectElement).value)"><option value="">Alle Autoren</option><option v-for="item in authors" :key="item.slug" :value="item.slug">{{ authorName(item) }}</option></select>
            <button v-if="showReset" class="btn btn-ghost btn-sm" @click="$emit('reset')">Zurücksetzen</button>
        </div>
    </section>
</template>
