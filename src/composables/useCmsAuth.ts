import { ref } from 'vue'

type TokenResponse = { access?: string; refresh?: string }
type JwtPayload = { exp?: number; id?: number; role?: string; token_type?: string }

const isLogin = ref(false)
const verificationPending = ref(false)
const accessToken = ref('')
const refreshToken = ref('')
let refreshRequest: Promise<boolean> | null = null

function decodeToken(token: string): JwtPayload {
    const payload = token.split('.')[1]
    if (!payload) throw new Error('Ungültiger Token.')
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as JwtPayload
}

function updateTokens(access: string, refresh: string) {
    const decodedAccess = decodeToken(access)
    const decodedRefresh = decodeToken(refresh)
    if (decodedAccess.token_type !== 'access' || decodedRefresh.token_type !== 'refresh') {
        throw new Error('Ungültige Token-Typen.')
    }

    localStorage.setItem('token', access)
    localStorage.setItem('refresh', refresh)
    accessToken.value = access
    refreshToken.value = refresh
    isLogin.value = true
    verificationPending.value = false
}

function removeTokens() {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh')
    accessToken.value = ''
    refreshToken.value = ''
    isLogin.value = false
    verificationPending.value = false
}

async function tokenData(response: Response): Promise<TokenResponse> {
    try {
        return (await response.json()) as TokenResponse
    } catch {
        return {}
    }
}

export function useCmsAuth() {
    async function refresh(): Promise<boolean> {
        if (refreshRequest) return refreshRequest

        refreshRequest = (async () => {
            const refresh = refreshToken.value || localStorage.getItem('refresh') || ''
            if (!refresh) {
                removeTokens()
                return false
            }

            try {
                const response = await fetch('/auth/refresh', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json;charset=UTF-8' },
                    body: JSON.stringify({ refresh }),
                })
                const data = await tokenData(response)
                if (!response.ok || !data.access || !data.refresh) {
                    removeTokens()
                    return false
                }
                updateTokens(data.access, data.refresh)
                return true
            } catch {
                removeTokens()
                return false
            }
        })()

        try {
            return await refreshRequest
        } finally {
            refreshRequest = null
        }
    }

    async function inspect() {
        const access = localStorage.getItem('token')
        const refreshTokenValue = localStorage.getItem('refresh')
        if (!access || !refreshTokenValue) {
            removeTokens()
            return false
        }

        try {
            const decodedAccess = decodeToken(access)
            const decodedRefresh = decodeToken(refreshTokenValue)
            if (decodedAccess.token_type !== 'access' || decodedRefresh.token_type !== 'refresh') {
                removeTokens()
                return false
            }

            const now = Date.now() / 1000
            if (decodedAccess.exp && decodedAccess.exp - now > 15) {
                updateTokens(access, refreshTokenValue)
                return true
            }
            if (decodedRefresh.exp && decodedRefresh.exp - now > 0) return refresh()

            removeTokens()
            return false
        } catch {
            removeTokens()
            return false
        }
    }

    async function login(username: string, password: string) {
        verificationPending.value = false
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json;charset=UTF-8' },
            body: JSON.stringify({ username, password }),
        })
        const data = await tokenData(response)
        if (!response.ok) throw new Error('Benutzername oder Passwort ist nicht korrekt.')

        if (data.access && data.refresh) {
            updateTokens(data.access, data.refresh)
            return 'authenticated' as const
        }
        verificationPending.value = true
        return 'verification' as const
    }

    async function verify(username: string, code: string) {
        const response = await fetch('/auth/verify', {
            method: 'POST',
            headers: { 'content-type': 'application/json;charset=UTF-8' },
            body: JSON.stringify({ username, code }),
        })
        const data = await tokenData(response)
        if (!response.ok || !data.access || !data.refresh) {
            throw new Error('Der Verifizierungscode ist nicht korrekt.')
        }
        updateTokens(data.access, data.refresh)
    }

    function resetVerification() {
        verificationPending.value = false
    }

    async function authenticatedFetch(input: string, init: RequestInit = {}) {
        await inspect()
        if (!isLogin.value) throw new Error('Bitte melde dich an.')

        const send = () => {
            const headers = new Headers(init.headers)
            headers.set('Authorization', `Bearer ${accessToken.value}`)
            return fetch(input, { ...init, headers })
        }

        const usedAccessToken = accessToken.value
        let response = await send()
        if (response.status === 401 && accessToken.value === usedAccessToken && (await refresh())) {
            response = await send()
        }
        if (response.status === 401) removeTokens()
        if (!response.ok) throw new Error(`CMS-Anfrage fehlgeschlagen (${response.status}).`)
        return response
    }

    return {
        isLogin,
        verificationPending,
        inspect,
        login,
        verify,
        resetVerification,
        authenticatedFetch,
    }
}
