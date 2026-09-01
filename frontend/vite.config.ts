import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 👈 WAJIB: Agar aset folder 'dist' terbaca dengan benar di Appwrite
})