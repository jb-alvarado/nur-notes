<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Note } from '../api/content'
import { useCmsAuth } from '../composables/useCmsAuth'
import { authorName, formatDate, noteImage, noteText } from '../utils/note'

const props = defineProps<{ note: Note | null; isLoading: boolean; error: string }>()
const { t } = useI18n()
const emit = defineEmits<{ close: []; edit: [note: Note] }>()
const auth = useCmsAuth()
const { isLogin } = auth
const image = computed(() => (props.note ? noteImage(props.note) : null))

watch(
    () => Boolean(props.note || props.isLoading || props.error),
    async (isOpen) => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        if (isOpen) await auth.inspect()
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
            <div class="absolute right-3 top-3 z-10 flex gap-1">
                <button
                    v-if="note && isLogin"
                    class="btn btn-sm btn-circle btn-ghost bg-base-100/80"
                    type="button"
                    :aria-label="t('common.edit')"
                    :title="t('common.edit')"
                    @click="emit('edit', note)"
                >
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        class="size-4 fill-none stroke-current stroke-2"
                    >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                    </svg>
                </button>
                <button
                    class="btn btn-sm btn-circle btn-ghost bg-base-100/80 text-xl"
                    :aria-label="t('common.close')"
                    @click="emit('close')"
                >
                    ✕
                </button>
            </div>
            <div v-if="isLoading" class="p-8">
                <div class="h-7 w-2/3 animate-pulse rounded bg-base-300"></div>
                <div class="mt-6 h-48 animate-pulse rounded bg-base-300"></div>
            </div>
            <div v-else-if="error" class="p-8">
                <p class="font-semibold">{{ t('notes.detailFailed') }}</p>
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
                            :to="{ name: 'notes', query: { category: note.category.slug } }"
                            class="badge badge-outline hover:border-primary hover:text-primary"
                        >
                            {{ note.category.name || t('common.general') }}
                        </RouterLink>
                        <span v-else class="badge badge-outline">{{
                            note.category?.name || t('common.general')
                        }}</span>
                        <time>{{ formatDate(note.created_at) }}</time>
                    </div>
                    <div class="mb-4 flex items-center gap-2 text-sm text-base-content/60">
                        <span>{{ t('filters.author') }}:</span>
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
                        {{ note.title || t('common.untitled') }}
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
            <button @click="emit('close')">{{ t('common.close') }}</button>
        </form>
    </dialog>
</template>
