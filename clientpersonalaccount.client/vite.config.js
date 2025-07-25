import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    },
    server: {
        port: 5173,
        https: {
            key: './aspnetcore-react.pem',
            cert: './aspnetcore-react.pem',
        }
    }
})