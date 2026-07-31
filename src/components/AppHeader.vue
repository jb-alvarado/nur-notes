<script setup lang="ts">
defineProps<{ isDark: boolean }>()
defineEmits<{ toggleTheme: [] }>()
</script>

<template>
    <header class="border-b border-base-300 bg-base-100/90 backdrop-blur">
        <div class="navbar mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-2">
            <RouterLink to="/" class="flex flex-1 items-center gap-3 whitespace-nowrap">
                <div
                    class="grid size-10 place-items-center rounded-xl bg-primary text-primary-content shadow-sm"
                >
                    <svg
                        viewBox="0 0 24 24"
                        class="size-5 fill-none stroke-current"
                        stroke-width="2"
                    >
                        <path
                            d="M7 3.75h8.5A1.5 1.5 0 0 1 17 5.25v15L12 17l-5 3.25v-15A1.5 1.5 0 0 1 8.5 3.75"
                        />
                    </svg>
                </div>
                <span class="text-xl font-bold tracking-tight"
                    >Nur <span class="text-primary">Notes</span></span
                >
            </RouterLink>
            <button
                class="btn btn-ghost btn-circle"
                :aria-label="isDark ? 'Helles Design' : 'Dunkles Design'"
                @click="$emit('toggleTheme')"
            >
                <svg
                    v-if="isDark"
                    viewBox="0 0 24 24"
                    class="size-5 fill-none stroke-current"
                    stroke-width="2"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path
                        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                    />
                </svg>
                <svg
                    v-else
                    viewBox="0 0 24 24"
                    class="size-5 fill-none stroke-current"
                    stroke-width="2"
                >
                    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
                </svg>
            </button>
        </div>
    </header>
</template>
