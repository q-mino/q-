// The server of development (A's decision of 23 Nov 2026: no bundler): it
// serves `dist/` at the app's base, as the release's host does, and with
// `--watch` composes it again when a source changes. No module replaced in
// place: the page is reloaded by hand. Local only, on 127.0.0.1.
// [Q, C, 24 Nov 2026]
// With `--gallery` (`pnpm gallery`, WEB-28) it composes `dist/` before it
// serves it, so that a clean checkout opens the gallery with one command,
// and tells the gallery's address. [Q, C, 24 Nov 2026]
//
// Usage: node build/serve.ts [--gallery] [--watch] [--port <n>] [--dir <dist>]

import { watch } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import { compose, the_release } from './compose.ts'

const the_phone = join(import.meta.dirname, '..')
const option = (name: string): string | undefined => {
  const at = process.argv.indexOf(name)
  return at >= 0 ? process.argv[at + 1] : undefined
}
const dist = option('--dir') ?? join(the_phone, 'dist')
const port = Number(option('--port') ?? '5173')
const base = '/q-/'

/** The types of the files of `dist/`; a module's must be JavaScript's, or the browser refuses it. */
const the_types: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.css': 'text/css; charset=utf-8',
}

/** The file of a path under the base, never out of `dist/`; the base itself is the page. */
const the_file = (path: string): string | undefined => {
  if (!path.startsWith(base)) return undefined
  const rest = decodeURIComponent(path.slice(base.length)) || 'index.html'
  const file = normalize(join(dist, rest))
  return file.startsWith(dist + sep) ? file : undefined
}

const server = createServer((request, response) => {
  const file = the_file(new URL(request.url ?? '/', 'http://localhost').pathname)
  void (async () => {
    if (file === undefined || !(await stat(file).catch(() => undefined))?.isFile()) {
      response.writeHead(404).end()
      return
    }
    response
      .writeHead(200, {
        'content-type': the_types[extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-cache',
      })
      .end(await readFile(file))
  })()
})

const the_gallery = process.argv.includes('--gallery')
const watches = process.argv.includes('--watch')
const composes = (): void => {
  try {
    const composed = compose(dist, the_release())
    console.log(`composed: ${String(composed.modules)} modules`)
  } catch (fault: unknown) {
    console.error(fault)
  }
}
if (the_gallery || watches) composes()

server.listen(port, '127.0.0.1', () => {
  const address = `http://localhost:${String(port)}${base}`
  console.log(the_gallery ? `${address}galleria.html` : address)
})

if (watches) {
  let next: ReturnType<typeof setTimeout> | undefined
  for (const folder of [
    'adapters-common',
    'adapters-web',
    'boundary',
    'domains',
    'memory',
    'phone',
    'extensions',
  ]) {
    watch(join(the_phone, '..', folder), { recursive: true }, (_, name) => {
      if (name === null || /(^|[/\\])(node_modules|dist|\.tsbuild)([/\\]|$)/.test(name)) return
      clearTimeout(next)
      next = setTimeout(composes, 200)
    })
  }
}
