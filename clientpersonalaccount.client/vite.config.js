import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: './index.html'
        }
    },
    server: {
        port: 5174
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
})
