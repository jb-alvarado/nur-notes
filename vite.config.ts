import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'nur notes',
                short_name: 'nur notes',
                description: 'Deine Notizen aus nur-cms.',
                theme_color: '#5a4ad1',
                background_color: '#f8f7ff',
                display: 'standalone',
            },
            workbox: {
                navigateFallbackDenylist: [
                    /^\/admin(?:\/|$)/,
                    /^\/api(?:\/|$)/,
                    /^\/auth(?:\/|$)/,
                    /^\/sse(?:\/|$)/,
                ],

                runtimeCaching: [
                    {
                        urlPattern: ({ url, request }) =>
                            request.method === 'GET' &&
                            !request.headers.has('authorization') &&
                            /^\/api\/content\/entries(?:\/[^/]+\/[^/]+)?$/.test(url.pathname),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'nur-cms-api',
                            networkTimeoutSeconds: 4,
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        host: '127.0.0.1',
        port: 5757,
        proxy: {
            '/admin': { target: 'http://127.0.0.1:5757', changeOrigin: true },
            '/api': { target: 'http://127.0.0.1:8777', changeOrigin: true },
            '/auth': { target: 'http://127.0.0.1:8777', changeOrigin: true },
            '/sse': { target: 'http://127.0.0.1:8777', changeOrigin: true },
            '/uploads': { target: 'http://127.0.0.1:8777', changeOrigin: true },
        },
    },
})
