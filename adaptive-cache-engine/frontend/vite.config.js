import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/run-simulation': 'http://localhost:3001',
            '/metrics': 'http://localhost:3001',
            '/policy-switch-log': 'http://localhost:3001',
            '/cache-state': 'http://localhost:3001',
            '/steps': 'http://localhost:3001',
            '/workloads': 'http://localhost:3001',
        }
    }
})
