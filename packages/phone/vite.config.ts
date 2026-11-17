import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import solid from 'vite-plugin-solid'

const git = (command: string): string => {
  try {
    return execSync(`git ${command}`, { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

// Where the files come from, shown in the update prompt and in "Informazioni".
const version = process.env['Q_VERSION'] ?? git('describe --tags --always --dirty')
const commit = process.env['GITHUB_SHA'] ?? git('rev-parse HEAD')
// 'release' on q-mino, 'test' on q-mino-prova, 'dev' locally.
const channel = process.env['Q_CHANNEL'] ?? 'dev'

export default defineConfig({
  base: '/q-/',
  define: {
    __Q_VERSION__: JSON.stringify(version),
    __Q_COMMIT__: JSON.stringify(commit),
    __Q_CHANNEL__: JSON.stringify(channel),
  },
  plugins: [
    solid(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      // No update without a gesture: the new worker waits until the user chooses.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'q-',
        short_name: 'q-',
        description: 'Cumino',
        lang: 'it',
        start_url: '/q-/',
        scope: '/q-/',
        display: 'standalone',
        background_color: '#fdf6ec',
        theme_color: '#8a5a2b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
})
