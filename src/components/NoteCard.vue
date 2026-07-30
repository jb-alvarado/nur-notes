<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '../api/content'
import { authorName, formatDate, noteExcerpt, noteImage } from '../utils/note'

const props = defineProps<{ note: Note }>()
const emit = defineEmits<{ select: [note: Note] }>()
const image = computed(() => noteImage(props.note))
const excerpt = computed(() => noteExcerpt(props.note, image.value ? 170 : 340))
</script>

<template>
    <article class="card h-full overflow-hidden border border-base-300 bg-base-100 shadow-sm hover:-translate-y-2 duration-200 transition-all">
        <button
            class="flex h-full w-full flex-col text-left cursor-pointer"
            type="button"
            :aria-label="`Notiz ${note.title || 'öffnen'}`"
            @click="emit('select', note)"
        >
            <figure v-if="image" class="h-36 shrink-0 bg-base-200">
                <img
                    :src="image.src"
                    :srcset="image.srcset || undefined"
                    :sizes="image.sizes"
                    :alt="image.alt"
                    class="size-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
            </figure>
            <!-- <div v-else aria-hidden="true" class="h-36 shrink-0 bg-base-200"></div> -->
            <div class="card-body flex flex-1 flex-col gap-3 p-5">
                <div class="flex items-center justify-between gap-2 text-xs text-base-content/55">
                    <span class="badge badge-outline badge-sm">{{
                        note.category?.name || 'Allgemein'
                    }}</span
                    ><time>{{ formatDate(note.created_at) }}</time>
                </div>
                <h2 class="card-title text-xl leading-tight">
                    {{ note.title || 'Unbenannte Notiz' }}
                </h2>
                <p class="text-sm leading-6 text-base-content/65">{{ excerpt }}</p>
                <div class="mt-auto flex flex-wrap gap-1.5 pt-2">
                    <span
                        v-for="tag in note.tags?.slice(0, 3)"
                        :key="tag.slug"
                        class="badge badge-ghost badge-sm"
                        >#{{ tag.name }}</span
                    >
                </div>
                <div
                    class="flex min-h-9 items-center gap-2 border-t border-base-200 pt-3 text-xs font-medium text-base-content/65"
                >
                    <span
                        v-if="note.authors?.length"
                        class="grid size-6 place-items-center rounded-full bg-secondary/20 text-secondary"
                        >{{ authorName(note.authors[0]).slice(0, 1) }}</span
                    ><template v-if="note.authors?.length">{{ authorName(note.authors[0]) }}</template>
                </div>
            </div>
        </button>
    </article>
</template>
