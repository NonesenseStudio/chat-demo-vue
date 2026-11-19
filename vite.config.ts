import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version: string }
const license = readFileSync(new URL('./LICENSE', import.meta.url), 'utf8')

// oxlint-disable-next-line import/no-default-export -- Vite reads the default export.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const standalone = mode === 'standalone'
  const target = ['chrome105', 'edge105', 'safari16', 'firefox110']

  return {
    base: standalone ? './' : env.VITE_BASE_PATH || './',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      vue(),
      {
        name: 'chat-demo-distribution',
        transformIndexHtml() {
          return [
            {
              tag: 'meta',
              attrs: { name: 'application-version', content: version },
            },
          ]
        },
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'LICENSE',
            source: license,
          })
        },
      },
      ...(standalone ? [viteSingleFile()] : []),
    ],
    define: {
      __API_ORIGIN__: JSON.stringify(env.VITE_API_ORIGIN || 'https://api.deepseek.com'),
    },
    server: {
      port: 8090,
      proxy: env.VITE_PROXY_TARGET
        ? {
            '/api': {
              target: env.VITE_PROXY_TARGET,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ''),
            },
          }
        : undefined,
    },
    build: {
      target,
      cssTarget: target,
      outDir: standalone ? 'dist-standalone' : 'dist',
    },
  }
})
