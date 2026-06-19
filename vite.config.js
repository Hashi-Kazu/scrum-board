/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // テスト時のみ vitest の esbuild トランスフォームに JSX 自動ランタイムを指定する。
  // 本番ビルドは oxc が JSX を処理するため esbuild 指定は不要（指定すると警告が出る）。
  ...(mode === 'test' ? { esbuild: { jsx: 'automatic' } } : {}),
  server: {
    port: 5173,
    strictPort: true, // ポートが使用中でも別ポートに逃げない
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
}))
