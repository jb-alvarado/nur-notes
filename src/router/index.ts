import { createRouter, createWebHistory } from 'vue-router'
import NotesView from '../views/NotesView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'notes', component: NotesView },
        { path: '/seite/:page(\\d+)', name: 'notes-page', component: NotesView },
    ],
})

export default router
