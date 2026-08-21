<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import type { Note } from './api/content'
import AppHeader from './components/AppHeader.vue'
import CreateNoteModal from './components/CreateNoteModal.vue'

const isDark = ref(localStorage.theme === 'dark' || (!localStorage.theme && matchMedia('(prefers-color-scheme: dark)').matches))
const isCreateNoteOpen = ref(false)
const noteToEdit = ref<Note | null>(null)

function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.theme = isDark.value ? 'dark' : 'light'
}

function openCreateNote() {
    noteToEdit.value = null
    isCreateNoteOpen.value = true
}

function openEditNote(event: Event) {
    noteToEdit.value = (event as CustomEvent<Note>).detail
    isCreateNoteOpen.value = Boolean(noteToEdit.value)
}

function closeNoteForm() {
    isCreateNoteOpen.value = false
    noteToEdit.value = null
}

watch(isDark, (dark) => (document.documentElement.dataset.theme = dark ? 'dark' : 'light'), { immediate: true })
onMounted(() => window.addEventListener('notes:edit', openEditNote))
onBeforeUnmount(() => window.removeEventListener('notes:edit', openEditNote))
</script>

<template>
    <div class="min-h-screen bg-base-200 text-base-content">
        <AppHeader :is-dark="isDark" @toggle-theme="toggleTheme" @create-note="openCreateNote" />
        <RouterView />
        <CreateNoteModal :open="isCreateNoteOpen" :note="noteToEdit" @close="closeNoteForm" />
    </div>
</template>
