// The domains' compiler (LIB-19, LIB-20): `node main.ts [--check | --watch] <root>...`.
// write (default): brings the generated files up to date; --check: fails if they are not;
// --watch: writes, then writes again at every change under the roots.
import { watch, type FSWatcher } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { run, type Mode } from './run.ts'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const repository = process.cwd()
const roots = args.filter((a) => !a.startsWith('--')).map((r) => resolve(repository, r))
const skipped = new Set(['node_modules', '.tsbuild', 'dist'])

async function foldersOf(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true })
  const subfolders = entries.filter((e) => e.isDirectory() && !skipped.has(e.name))
  const nested = await Promise.all(subfolders.map((e) => foldersOf(join(folder, e.name))))
  return [folder, ...nested.flat()]
}

const mode: Mode = flags.has('--check') ? 'check' : 'write'

async function once(): Promise<boolean> {
  let clean = true
  for (const root of roots) {
    const { errors, changes } = await run(root, mode, repository)
    for (const line of errors) console.error(line)
    for (const line of changes)
      console.log(mode === 'write' ? `written ${line}` : `out of date: ${line}`)
    if (errors.length > 0 || (mode === 'check' && changes.length > 0)) clean = false
  }
  return clean
}

if (roots.length === 0) {
  console.error('usage: node main.ts [--check | --watch] <root>...')
  process.exitCode = 2
} else if (flags.has('--watch')) {
  let running = false
  let again = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const compileNow = async (): Promise<void> => {
    if (running) {
      again = true
      return
    }
    running = true
    await once()
    running = false
    if (again) {
      again = false
      await compileNow()
    }
  }
  await compileNow()
  // One watcher per folder: Node's recursive watch on Linux fails silently when the system's
  // watchers (inotify instances) are exhausted; this one says so. New folders are watched after a change.
  const watchers = new Map<string, FSWatcher>()
  const onChange = (): void => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      void compileNow().then(watchAll)
    }, 150)
  }
  const watchAll = async (): Promise<void> => {
    for (const folder of (await Promise.all(roots.map(foldersOf))).flat()) {
      if (watchers.has(folder)) continue
      try {
        const watcher = watch(folder, onChange)
        watcher.on('error', () => {
          watcher.close()
          watchers.delete(folder)
        })
        watchers.set(folder, watcher)
      } catch (error) {
        console.error(
          `cannot watch ${folder}: ${error instanceof Error ? error.message : String(error)}`,
        )
        for (const watcher of watchers.values()) watcher.close()
        watchers.clear()
        process.exitCode = 1
        return
      }
    }
  }
  await watchAll()
  if (watchers.size > 0) console.log(`watching ${String(watchers.size)} folder(s)`)
} else {
  process.exitCode = (await once()) ? 0 : 1
}
