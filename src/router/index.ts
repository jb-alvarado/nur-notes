import { createRouter, createWebHistory } from 'vue-router'
import NotesView from '../views/NotesView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'notes', component: NotesView },
        { path: '/kategorie/:category', name: 'notes-category', component: NotesView },
        { path: '/tag/:tag', name: 'notes-tag', component: NotesView },
        { path: '/autor/:author', name: 'notes-author', component: NotesView },
    ],
})

export default router
