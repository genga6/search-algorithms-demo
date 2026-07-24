import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  // 相対パス。GitHub Pages のプロジェクトサブパス配信でもアセットを正しく解決する。
  base: "./",
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
})
