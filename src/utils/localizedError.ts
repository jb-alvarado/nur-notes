import { i18n } from '../i18n'

type ErrorParams = Record<string, string | number>

export class LocalizedError extends Error {
    constructor(
        readonly key: string,
        readonly params?: ErrorParams,
    ) {
        super(key)
        this.name = 'LocalizedError'
    }
}

export function toLocalizedError(cause: unknown, fallbackKey: string): LocalizedError {
    return cause instanceof LocalizedError ? cause : new LocalizedError(fallbackKey)
}

export function localizedErrorText(error: LocalizedError | null): string {
    if (!error) return ''
    // Vue I18n tracks the locale when called from a computed property.
    return i18n.global.t(error.key, error.params ?? {})
}
