import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from 'path'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import VitePluginHtmlEnv from 'vite-plugin-html-env'

export default defineConfig({
    server: {
        proxy: {
            // Key is the path to match
            // Value is the proxy target
            '/searchzipcode': {
                target: 'https://searchaddress-api.motocle8.com', // Target API
                changeOrigin: true, // Needed for virtual hosted sites
                rewrite: (path) => path.replace(/^\/searchzipcode/, ''), // Rewrite the API path to the target path
            }
        }
    },
    
    plugins: [
        vue({
            template: { transformAssetUrls }
        }),

        quasar({
            sassVariables: 'src/styles/quasar-variables.scss'
        }),
        VitePluginHtmlEnv({
            compiler: true
            // compiler: false // old
         })
    ],
    resolve: {
        alias: [
            { find: '@', replacement: path.resolve(__dirname, './src') },
        ],
    },
    base: process.env.VITE_BASE_URL,
    build: {
        assetsDir: 'assets',
    },
    optimizeDeps: {
        include: ['axios'],
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@import "src/styles/quasar-variables.scss";`,
            },
        },
    },
});