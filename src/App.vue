<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'

const isDark = ref(localStorage.theme === 'dark' || (!localStorage.theme && matchMedia('(prefers-color-scheme: dark)').matches))

function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.theme = isDark.value ? 'dark' : 'light'
}

watch(isDark, (dark) => (document.documentElement.dataset.theme = dark ? 'dark' : 'light'), { immediate: true })
</script>

<template>
    <div class="min-h-screen bg-base-200 text-base-content">
        <AppHeader :is-dark="isDark" @toggle-theme="toggleTheme" />
        <RouterView />
    </div>
</template>
