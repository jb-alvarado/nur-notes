import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import de from './locales/de.js'

export type UiLocale = 'en' | 'de'
const storageKey = 'nur-notes-ui-language'

function initialLocale(): UiLocale {
    try {
        const saved = localStorage.getItem(storageKey)
        if (saved === 'en' || saved === 'de') return saved
    } catch {
        // Storage may be unavailable; the browser language remains usable.
    }
    const browserLanguage = navigator.languages?.[0] || navigator.language || ''
    return browserLanguage.toLowerCase().startsWith('de') ? 'de' : 'en'
}

export const i18n = createI18n({
    legacy: false,
    locale: initialLocale(),
    fallbackLocale: 'en',
    messages: { en, de },
})

export function setUiLocale(locale: UiLocale) {
    i18n.global.locale.value = locale
    try {
        localStorage.setItem(storageKey, locale)
    } catch {
        /* Keep the in-memory selection. */
    }
}

export function syncDocumentLocale() {
    const { t, locale } = i18n.global
    document.documentElement.lang = locale.value
    document.title = t('meta.title')
    const description = t('meta.description')
    for (const [selector, value] of [
        ['meta[name="description"]', description],
        ['meta[property="og:description"]', description],
        ['meta[name="twitter:description"]', description],
        ['meta[property="og:title"]', document.title],
        ['meta[name="twitter:title"]', document.title],
        ['meta[property="og:locale"]', locale.value === 'de' ? 'de_DE' : 'en_US'],
    ] as Array<[string, string]>)
        document.querySelector(selector)?.setAttribute('content', value)
}
