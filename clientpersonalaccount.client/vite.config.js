import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../clientpersonalaccount.Server/wwwroot',
        emptyOutDir: true,
        rollupOptions: {
            input: './index.html'
        }
    },
    server: {
        port: 5173
    },
    "scripts": {
        "build": "vite build"
    }
})