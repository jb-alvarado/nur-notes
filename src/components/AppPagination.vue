<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ page: number; pages: number; total: number; pageSize: number }>()
defineEmits<{ change: [page: number] }>()

const pageList = computed<Array<number | '…'>>(() => {
    const maxButtons = 5
    if (props.pages <= maxButtons) return Array.from({ length: props.pages }, (_, index) => index + 1)

    const start = Math.max(2, Math.min(props.page - 1, props.pages - 3))
    const end = Math.min(props.pages - 1, start + 2)

    return [
        1,
        ...(start > 2 ? ['…' as const] : []),
        ...Array.from({ length: end - start + 1 }, (_, index) => start + index),
        ...(end < props.pages - 1 ? ['…' as const] : []),
        props.pages,
    ]
})

const displayFrom = computed(() => (props.total ? (props.page - 1) * props.pageSize + 1 : 0))
const displayTo = computed(() => Math.min(props.total, props.page * props.pageSize))
</script>

<template>
    <nav
        v-if="pages > 1"
        class="mt-10 flex items-center justify-between gap-4"
        aria-label="Seitennavigation"
    >
        <p class="hidden text-sm text-base-content/70 md:block">{{ displayFrom }}–{{ displayTo }} von {{ total }}</p>
        <div class="join mx-auto md:mx-0">
            <button
                class="join-item btn btn-sm sm:btn-md"
                :disabled="page === 1"
                aria-label="Vorherige Seite"
                @click="$emit('change', page - 1)"
            >
                ‹
            </button>
            <template v-for="(item, index) in pageList" :key="`${item}-${index}`">
                <button
                    v-if="item !== '…'"
                    class="join-item btn btn-sm sm:btn-md"
                    :class="{ 'btn-active': item === page }"
                    @click="$emit('change', item)"
                >
                    {{ item }}
                </button>
                <span v-else class="join-item btn btn-disabled btn-sm sm:btn-md" aria-hidden="true">…</span>
            </template>
            <button
                class="join-item btn btn-sm sm:btn-md"
                :disabled="page === pages"
                aria-label="Nächste Seite"
                @click="$emit('change', page + 1)"
            >
                ›
            </button>
        </div>
    </nav>
</template>
