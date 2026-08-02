<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Note } from '../api/content'
import { authorName, formatDate, noteImage, noteText } from '../utils/note'

const props = defineProps<{ note: Note | null; isLoading: boolean; error: string }>()
const emit = defineEmits<{ close: [] }>()
const image = computed(() => (props.note ? noteImage(props.note) : null))

watch(
    () => Boolean(props.note || props.isLoading || props.error),
    (isOpen) => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
    },
)
</script>

<template>
    <dialog
        class="modal"
        :open="note !== null || isLoading || Boolean(error)"
        @click.self="emit('close')"
    >
        <div class="modal-box max-w-3xl p-0">
            <button
                class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10 bg-base-100/80 text-xl"
                aria-label="Dialog schließen"
                @click="emit('close')"
            >
                ✕
            </button>
            <div v-if="isLoading" class="p-8">
                <div class="h-7 w-2/3 animate-pulse rounded bg-base-300"></div>
                <div class="mt-6 h-48 animate-pulse rounded bg-base-300"></div>
            </div>
            <div v-else-if="error" class="p-8">
                <p class="font-semibold">Notiz konnte nicht geladen werden</p>
                <p class="mt-2 text-base-content/60">{{ error }}</p>
            </div>
            <template v-else-if="note">
                <figure v-if="image" class="max-h-96 bg-base-200">
                    <img
                        :src="image.src"
                        :srcset="image.srcset || undefined"
                        sizes="(min-width: 768px) 42rem, calc(100vw - 3rem)"
                        :alt="image.alt"
                        class="max-h-96 w-full object-cover"
                    />
                </figure>
                <article class="p-6 sm:p-8">
                    <div
                        class="mb-4 flex flex-wrap items-center gap-2 text-sm text-base-content/60"
                    >
                        <RouterLink
                            v-if="note.category?.slug"
                            :to="{
                                name: 'notes',
                                query: { category: note.category.slug },
                            }"
                            class="badge badge-outline hover:border-primary hover:text-primary"
                        >
                            {{ note.category.name || 'Allgemein' }}
                        </RouterLink>
                        <span v-else class="badge badge-outline">{{
                            note.category?.name || 'Allgemein'
                        }}</span>
                        <time>{{ formatDate(note.created_at) }}</time>
                    </div>
                    <div class="mb-4 flex items-center gap-2 text-sm text-base-content/60">
                        <span>Autor:</span>
                        <template v-for="author in note.authors" :key="author.slug">
                            <RouterLink
                                v-if="author.slug"
                                :to="{ name: 'notes', query: { author: author.slug } }"
                                class="link link-hover font-medium text-base-content"
                            >
                                {{ authorName(author) }}
                            </RouterLink>
                            <span v-else>{{ authorName(author) }}</span>
                        </template>
                    </div>
                    <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
                        {{ note.title || 'Unbenannte Notiz' }}
                    </h2>
                    <p class="mt-6 whitespace-pre-wrap leading-7 text-base-content/80">
                        {{ noteText(note) }}
                    </p>
                    <div v-if="note.tags?.length" class="mt-7 flex flex-wrap gap-2">
                        <RouterLink
                            v-for="tag in note.tags"
                            :key="tag.slug"
                            :to="{ name: 'notes', query: { tag: tag.slug } }"
                            class="badge badge-ghost hover:border-primary hover:text-primary"
                        >
                            #{{ tag.name }}
                        </RouterLink>
                    </div>
                </article>
            </template>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button @click="emit('close')">schließen</button>
        </form>
    </dialog>
</template>
