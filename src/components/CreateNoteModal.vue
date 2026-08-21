<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Multiselect from 'vue-multiselect'
import { noteTypeSlug, type ListResponse, type Note } from '../api/content'
import { useCmsAuth } from '../composables/useCmsAuth'

type ContentType = { id?: number; slug?: string }
type ContentLocale = { id?: number; code?: string; name?: string }
type AuthorOption = { id: number; first_name?: string; last_name?: string; slug?: string; displayName: string }
type CategoryOption = { id: number; locale_id?: number; name?: string; slug?: string }
type TagOption = { id: number; name: string; slug: string }
type EditableNode = { id?: number; name?: string; text?: string; media_id?: number; data?: unknown; blocks?: EditableNode[] }
type EditableEntry = {
    id?: number
    title?: string
    locale_id?: number
    category_id?: number | null
    tags?: Array<Omit<TagOption, 'slug'> & { slug?: string }>
    authors?: Array<Omit<AuthorOption, 'displayName'>>
    nodes?: EditableNode[]
}

const props = defineProps<{ open: boolean; note?: Note | null }>()
const emit = defineEmits<{ close: [] }>()
const auth = useCmsAuth()
const { isLogin, verificationPending } = auth
const username = ref('')
const password = ref('')
const code = ref('')
const title = ref('')
const text = ref('')
const localeId = ref<number | null>(null)
const locales = ref<ContentLocale[]>([])
const authors = ref<AuthorOption[]>([])
const categories = ref<CategoryOption[]>([])
const tags = ref<TagOption[]>([])
const selectedAuthors = ref<AuthorOption[]>([])
const selectedCategory = ref<CategoryOption | null>(null)
const selectedTags = ref<TagOption[]>([])
const editingNodes = ref<EditableNode[]>([])
const originalTagIds = ref<number[]>([])
const originalAuthorIds = ref<number[]>([])
const error = ref('')
const isLoading = ref(false)
const isCreatingTag = ref(false)
const isEditing = computed(() => Boolean(props.note?.id))
const availableCategories = computed(() =>
    categories.value.filter((category) => !localeId.value || category.locale_id === localeId.value),
)

function slugify(value: string) {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function resetForm() {
    title.value = ''
    text.value = ''
    localeId.value = locales.value.length === 1 ? (locales.value[0]?.id ?? null) : null
    selectedAuthors.value = []
    selectedCategory.value = null
    selectedTags.value = []
    editingNodes.value = []
    originalTagIds.value = []
    originalAuthorIds.value = []
}

async function loadCreationOptions() {
    const [typeResponse, localeResponse, authorResponse, categoryResponse, tagResponse] = await Promise.all([
        auth.authenticatedFetch('/api/content/types?fields=id,slug&limit=200'),
        auth.authenticatedFetch('/api/locales?fields=id,code,name&limit=200'),
        auth.authenticatedFetch('/api/content/authors?fields=id,first_name,last_name,slug&limit=200&ordering=last_name'),
        auth.authenticatedFetch('/api/content/categories?fields=id,locale_id,name,slug&limit=200&ordering=name'),
        auth.authenticatedFetch('/api/content/tags?fields=id,name,slug&limit=200&ordering=name'),
    ])
    const types = (await typeResponse.json()) as ListResponse<ContentType>
    const localeList = (await localeResponse.json()) as ListResponse<ContentLocale>
    const authorList = (await authorResponse.json()) as ListResponse<Omit<AuthorOption, 'displayName'>>
    const categoryList = (await categoryResponse.json()) as ListResponse<CategoryOption>
    const tagList = (await tagResponse.json()) as ListResponse<TagOption>
    const type = types.results.find((item) => item.slug === noteTypeSlug)
    if (!type?.id) throw new Error(`Der CMS-Inhaltstyp „${noteTypeSlug}“ wurde nicht gefunden.`)

    locales.value = localeList.results
    authors.value = authorList.results.map((author) => ({
        ...author,
        displayName: [author.first_name, author.last_name].filter(Boolean).join(' '),
    }))
    categories.value = categoryList.results
    tags.value = tagList.results
    return type.id
}

function optionById<T extends { id: number }>(options: T[], option?: { id?: number }) {
    return option?.id ? options.find((item) => item.id === option.id) : undefined
}

async function loadNoteForEditing(id: number) {
    const response = await auth.authenticatedFetch(
        `/api/content/entries?type_slug=${encodeURIComponent(noteTypeSlug)}&id=${id}&output_type=markdown`,
    )
    const result = (await response.json()) as ListResponse<EditableEntry>
    const entry = result.results[0]
    if (!entry) throw new Error('Die Notiz konnte nicht zum Bearbeiten geladen werden.')

    title.value = entry.title ?? ''
    localeId.value = entry.locale_id ?? null
    selectedCategory.value = categories.value.find((category) => category.id === entry.category_id) ?? null
    selectedAuthors.value = (entry.authors ?? [])
        .map((author) => optionById(authors.value, author))
        .filter((author): author is AuthorOption => Boolean(author))
    selectedTags.value = (entry.tags ?? [])
        .map((tag) => optionById(tags.value, tag))
        .filter((tag): tag is TagOption => Boolean(tag))
    originalAuthorIds.value = selectedAuthors.value.map((author) => author.id)
    originalTagIds.value = selectedTags.value.map((tag) => tag.id)
    editingNodes.value = entry.nodes ?? []
    text.value = editingNodes.value.find((node) => !node.blocks)?.text ?? ''
}

let noteTypeId: number | null = null

watch(localeId, () => {
    if (selectedCategory.value && selectedCategory.value.locale_id !== localeId.value) {
        selectedCategory.value = null
    }
})

watch(
    [() => props.open, () => props.note?.id],
    async ([open]) => {
        if (!open) return
        error.value = ''
        isLoading.value = true
        try {
            if (await auth.inspect()) {
                auth.resetVerification()
                noteTypeId = await loadCreationOptions()
                resetForm()
                if (props.note?.id) await loadNoteForEditing(props.note.id)
            } else {
                auth.resetVerification()
            }
        } catch (cause) {
            error.value = cause instanceof Error ? cause.message : 'Anmeldung konnte nicht geprüft werden.'
        } finally {
            isLoading.value = false
        }
    },
)

async function login() {
    isLoading.value = true
    error.value = ''
    try {
        const result = await auth.login(username.value, password.value)
        password.value = ''
        if (result === 'authenticated') {
            noteTypeId = await loadCreationOptions()
            resetForm()
            if (props.note?.id) await loadNoteForEditing(props.note.id)
        }
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Anmeldung fehlgeschlagen.'
    } finally {
        isLoading.value = false
    }
}

async function verify() {
    isLoading.value = true
    error.value = ''
    try {
        await auth.verify(username.value, code.value)
        code.value = ''
        noteTypeId = await loadCreationOptions()
        resetForm()
        if (props.note?.id) await loadNoteForEditing(props.note.id)
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Verifizierung fehlgeschlagen.'
    } finally {
        isLoading.value = false
    }
}

async function updateRelations(entryId: number) {
    const currentTagIds = new Set(selectedTags.value.map((tag) => tag.id))
    const currentAuthorIds = new Set(selectedAuthors.value.map((author) => author.id))
    const previousTagIds = new Set(originalTagIds.value)
    const previousAuthorIds = new Set(originalAuthorIds.value)
    await Promise.all([
        ...originalTagIds.value.filter((id) => !currentTagIds.has(id)).map((id) =>
            auth.authenticatedFetch(`/api/content/entries/${entryId}/tag/${id}`, { method: 'DELETE' }),
        ),
        ...selectedTags.value.filter((tag) => !previousTagIds.has(tag.id)).map((tag) =>
            auth.authenticatedFetch('/api/content/entries/tag', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ entry_id: entryId, tag_id: tag.id }),
            }),
        ),
        ...originalAuthorIds.value.filter((id) => !currentAuthorIds.has(id)).map((id) =>
            auth.authenticatedFetch(`/api/content/entries/${entryId}/author/${id}`, { method: 'DELETE' }),
        ),
        ...selectedAuthors.value.filter((author) => !previousAuthorIds.has(author.id)).map((author) =>
            auth.authenticatedFetch('/api/content/entries/author', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ entry_id: entryId, author_id: author.id }),
            }),
        ),
    ])
}

function nodesForSave() {
    if (!isEditing.value || !editingNodes.value.length) {
        return [{ order_index: 1, text: text.value.trim() }]
    }
    const firstTextNode = editingNodes.value.find((node) => !node.blocks)
    if (firstTextNode) firstTextNode.text = text.value.trim()
    return editingNodes.value
}

async function saveNote() {
    if (!noteTypeId || !localeId.value) {
        error.value = 'Inhaltstyp oder Sprache konnten nicht geladen werden.'
        return
    }
    const normalizedTitle = title.value.trim()
    const noteSlug = slugify(normalizedTitle)
    if (!noteSlug) {
        error.value = 'Aus dem Titel konnte kein gültiger Slug erstellt werden.'
        return
    }

    isLoading.value = true
    error.value = ''
    try {
        const payload = {
            locale_id: localeId.value,
            category_id: selectedCategory.value?.id ?? null,
            title: normalizedTitle,
            slug: noteSlug,
            nodes: nodesForSave(),
        }
        const entryId = props.note?.id
        if (entryId) {
            await auth.authenticatedFetch(`/api/content/entries/${entryId}`, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            })
            await updateRelations(entryId)
            window.dispatchEvent(
                new CustomEvent('notes:updated', { detail: { oldSlug: props.note?.slug, newSlug: noteSlug } }),
            )
        } else {
            const response = await auth.authenticatedFetch('/api/content/entries', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ type_id: noteTypeId, status: 'published', ...payload }),
            })
            const newId = (await response.json()) as number
            await updateRelations(newId)
            window.dispatchEvent(new Event('notes:created'))
        }
        emit('close')
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Notiz konnte nicht gespeichert werden.'
    } finally {
        isLoading.value = false
    }
}

async function deleteNote() {
    if (!props.note?.id || isLoading.value) return
    if (!window.confirm(`Notiz „${props.note.title || 'ohne Titel'}“ wirklich löschen?`)) return

    isLoading.value = true
    error.value = ''
    try {
        await auth.authenticatedFetch(`/api/content/entries/${props.note.id}`, { method: 'DELETE' })
        window.dispatchEvent(new Event('notes:deleted'))
        emit('close')
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Notiz konnte nicht gelöscht werden.'
    } finally {
        isLoading.value = false
    }
}

async function insertTag(name: string) {
    const normalizedName = name.trim()
    if (!normalizedName) return
    const existingTag = tags.value.find(
        (tag) => tag.name.localeCompare(normalizedName, undefined, { sensitivity: 'accent' }) === 0,
    )
    if (existingTag) {
        if (!selectedTags.value.some((tag) => tag.id === existingTag.id)) selectedTags.value.push(existingTag)
        return
    }

    isCreatingTag.value = true
    error.value = ''
    try {
        const tag: Omit<TagOption, 'id'> = { name: normalizedName, slug: slugify(normalizedName) }
        const response = await auth.authenticatedFetch('/api/content/tags', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(tag),
        })
        const created = { ...tag, id: (await response.json()) as number }
        tags.value.push(created)
        selectedTags.value.push(created)
    } catch (cause) {
        error.value = cause instanceof Error ? cause.message : 'Tag konnte nicht angelegt werden.'
    } finally {
        isCreatingTag.value = false
    }
}
</script>

<template>
    <dialog class="modal modal-bottom sm:modal-middle" :open="open" @click.self="emit('close')">
        <div class="modal-box max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl p-5 sm:rounded-2xl sm:p-6">
            <div class="absolute right-3 top-3 flex gap-1">
                <button
                    v-if="isEditing && isLogin"
                    class="btn btn-sm btn-circle btn-ghost text-error"
                    type="button"
                    aria-label="Notiz löschen"
                    title="Notiz löschen"
                    :disabled="isLoading"
                    @click="deleteNote"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="size-4 fill-none stroke-current stroke-2">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v5M14 11v5" />
                    </svg>
                </button>
                <button class="btn btn-sm btn-circle btn-ghost" aria-label="Schließen" @click="emit('close')">✕</button>
            </div>
            <h2 class="text-xl font-bold">{{ isEditing ? 'Notiz bearbeiten' : 'Neue Notiz' }}</h2>
            <p v-if="!isLogin" class="mt-2 text-sm text-base-content/60">Melde dich an, um eine Notiz zu {{ isEditing ? 'bearbeiten' : 'erstellen' }}.</p>
            <div v-if="error" class="alert alert-error mt-4 text-sm"><span>{{ error }}</span></div>
            <div v-if="isLoading" class="mt-6 flex justify-center"><span class="loading loading-spinner loading-md"></span></div>
            <form v-else-if="isLogin" class="mt-5 grid gap-3" @submit.prevent="saveNote">
                <input v-model="title" class="input input-bordered w-full" placeholder="Titel" required />
                <fieldset class="fieldset min-w-0">
                    <legend class="fieldset-legend">Sprache</legend>
                    <select v-model="localeId" class="select select-bordered w-full" aria-label="Sprache auswählen" required>
                        <option :value="null" disabled>Sprache auswählen</option>
                        <option v-for="locale in locales" :key="locale.id" :value="locale.id">{{ locale.name || locale.code }}</option>
                    </select>
                </fieldset>
                <div class="grid gap-3 sm:grid-cols-2">
                    <fieldset class="fieldset min-w-0">
                        <legend class="fieldset-legend">Autoren</legend>
                        <Multiselect v-model="selectedAuthors" track-by="id" label="displayName" placeholder="Autoren auswählen" :options="authors" :multiple="true" aria-label="Autoren auswählen" />
                    </fieldset>
                    <fieldset class="fieldset min-w-0">
                        <legend class="fieldset-legend">Kategorie</legend>
                        <Multiselect v-model="selectedCategory" track-by="id" label="name" placeholder="Kategorie auswählen" :options="availableCategories" :allow-empty="true" aria-label="Kategorie auswählen" />
                    </fieldset>
                </div>
                <fieldset class="fieldset min-w-0">
                    <legend class="fieldset-legend">Tags</legend>
                    <Multiselect v-model="selectedTags" track-by="id" label="name" placeholder="Tags auswählen oder neu anlegen" tag-placeholder="Neuen Tag anlegen" :options="tags" :multiple="true" :taggable="true" :loading="isCreatingTag" :disabled="isCreatingTag" aria-label="Tags auswählen" @tag="insertTag" />
                </fieldset>
                <textarea v-model="text" class="textarea textarea-bordered min-h-36 w-full sm:min-h-44" placeholder="Deine Notiz …" required></textarea>
                <button class="btn btn-primary">{{ isEditing ? 'Änderungen speichern' : 'Notiz veröffentlichen' }}</button>
            </form>
            <form v-else-if="verificationPending" class="mt-5 grid gap-3" @submit.prevent="verify">
                <p class="text-sm text-base-content/60">Gib den zugesandten Verifizierungscode ein.</p>
                <input v-model="code" class="input input-bordered w-full" autocomplete="one-time-code" inputmode="numeric" placeholder="Verifizierungscode" required />
                <button class="btn btn-primary">Code bestätigen</button>
            </form>
            <form v-else class="mt-5 grid gap-3" @submit.prevent="login">
                <input v-model="username" class="input input-bordered w-full" autocomplete="username" placeholder="Benutzername oder E-Mail" required />
                <input v-model="password" class="input input-bordered w-full" type="password" autocomplete="current-password" placeholder="Passwort" required />
                <button class="btn btn-primary">Anmelden</button>
            </form>
        </div>
        <form method="dialog" class="modal-backdrop"><button @click="emit('close')">schließen</button></form>
    </dialog>
</template>
