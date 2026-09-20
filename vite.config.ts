import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` must match the GitHub Pages repo name so built asset paths resolve
// correctly at https://<user>.github.io/nkg-want-list-plus/.
export default defineConfig({
  base: '/nkg-want-list-plus/',
  plugins: [react()],
})
