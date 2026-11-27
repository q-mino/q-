// The copy (AST-11): what the answerer reads, made at the start and once a
// day in a new folder under the node's data (`copy/`), swapped whole between
// turns (a rename), read-only. `progetto/`, the project's notes of an
// allow-list only, each read before it is copied and left out whole if it
// holds a word never copied (its path told once, never the line); `repo/`,
// this repository's documents (README, `docs/*.md`, the packages' READMEs),
// never a `CLAUDE.md`, a `CLAUDE.local.md` or `.claude/`.
//
// **The source** [Q, C, 28 Nov 2026] (the night's direction, part B3): the
// project's worktree `~/my-brain/wt/q/projects/q/` (branch `proj/q`), where
// the notes are current, not the master checkout, which is behind it until
// a milestone integrates it; a setting (`CUMINO_ASSISTANT_SOURCE`). B1 had
// rejected the worktree for its work in progress and its `richieste/`: the
// allow-list leaves both out (only the sixteen notes named below enter, and
// `richieste/` is not one of them), and the source is mounted read-only.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  chmodSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'

/** The notes of the project copied (AST-11): these and no other. */
export const the_allow_list = [
  'definizione.md',
  'galateo.md',
  'emergenze.md',
  'flussi.md',
  'catalogo.md',
  'messaggi-e-fiducia.md',
  'nodi-e-caratteri.md',
  'questioni-aperte.md',
  'racconto.md',
  'fase-4.md',
  'fattibilita.md',
  'schermate.md',
  'import/guida-semplice.md',
  'import/manifesto-breve.md',
  'import/manifesto-esteso.md',
  'import/vocabolario.md',
] as const

/** The repository's words never copied (AST-11); the laptop's own are in `never-copied.txt`. */
export const the_words_never_copied = [
  '/home/',
  'C:\\Users',
  'my-brain',
  'AWS_PROFILE',
  'IAM',
  '€',
  'quota',
] as const

/**
 * Whether a text holds a word never copied [Q, C, 28 Nov 2026]: a word of
 * letters alone as a whole word, whatever its case (a first name, `IAM`,
 * `quota`: never inside another word, «chiamare»); any other as it is
 * written, anywhere (`/home/`, `C:\Users`, `€`). Rejected: every word
 * anywhere, as written (`IAM` would miss «iam»; a name would be met inside
 * longer words, leaving notes out for nothing).
 */
export const holds_a_word_of = (words: readonly string[]) => {
  const whole = words.filter((word) => /^\p{L}+$/u.test(word))
  const anywhere = words.filter((word) => !/^\p{L}+$/u.test(word))
  const of_letters =
    whole.length === 0
      ? undefined
      : new RegExp(
          `(?<!\\p{L})(?:${whole.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?!\\p{L})`,
          'iu',
        )
  return (text: string): boolean =>
    (of_letters?.test(text) ?? false) || anywhere.some((word) => text.includes(word))
}

/** The laptop's own words never copied (`never-copied.txt`): one per line, `#` for a comment; none if there is no file. */
export const the_words_in = (file: string): readonly string[] =>
  existsSync(file)
    ? readFileSync(file, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '' && !line.startsWith('#'))
    : []

/** The repository's documents (AST-11): its README, `docs/*.md`, every package's README; no `node_modules`, no rules of an agent. */
export const the_documents_of = (repository: string): readonly string[] => {
  const found: string[] = []
  const walk = (folder: string): void => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      const path = join(folder, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.name === 'README.md') found.push(relative(repository, path))
    }
  }
  if (existsSync(join(repository, 'README.md'))) found.push('README.md')
  const docs = join(repository, 'docs')
  if (existsSync(docs))
    for (const name of readdirSync(docs))
      if (name.endsWith('.md') && name !== 'CLAUDE.md') found.push(join('docs', name))
  const packages = join(repository, 'packages')
  if (existsSync(packages)) walk(packages)
  return found.sort()
}

/** Where a copy comes from (AST-11, AST-14). */
export interface TheCopysSources {
  /** The project's notes (`CUMINO_ASSISTANT_SOURCE`). */
  readonly source: string
  /** The repository's documents: the release checkout, or the image's folder of them. */
  readonly repository: string
  /** The laptop's words never copied (`never-copied.txt`). */
  readonly never_copied: readonly string[]
}

/** A copy made: its folder, how many files it holds, the notes left out by path. */
export interface ACopy {
  readonly folder: string
  readonly files: number
  readonly left_out: readonly string[]
  readonly missing: readonly string[]
}

/** A file written read-only, its folder made. */
const written_read_only = (path: string, content: Buffer): void => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, { mode: 0o444 })
}

/**
 * A copy made under `copies/`, swapped whole (AST-11): written in a folder
 * of its own named by its instant, then renamed into place; the older
 * copies removed (no answerer runs while a copy is made: one turn at a
 * time).
 */
export const a_copy_made = (sources: TheCopysSources, copies: string, stamp: string): ACopy => {
  const words = holds_a_word_of([...the_words_never_copied, ...sources.never_copied])
  mkdirSync(copies, { recursive: true, mode: 0o700 })
  const making = join(copies, `.making-${stamp}`)
  rmSync(making, { recursive: true, force: true })
  const left_out: string[] = []
  const missing: string[] = []
  let files = 0
  for (const note of the_allow_list) {
    const from = join(sources.source, note)
    if (!existsSync(from) || !statSync(from).isFile()) {
      missing.push(note)
      continue
    }
    const content = readFileSync(from)
    if (words(content.toString('utf8'))) {
      left_out.push(note)
      continue
    }
    written_read_only(join(making, 'progetto', note), content)
    files += 1
  }
  for (const document of the_documents_of(sources.repository)) {
    written_read_only(
      join(making, 'repo', document),
      readFileSync(join(sources.repository, document)),
    )
    files += 1
  }
  const folder = join(copies, stamp)
  rmSync(folder, { recursive: true, force: true })
  renameSync(making, folder)
  for (const each of readdirSync(copies))
    if (each !== stamp) {
      const older = join(copies, each)
      chmod_writable(older)
      rmSync(older, { recursive: true, force: true })
    }
  return { folder, files, left_out, missing }
}

/** A folder made writable again by its user, to be removed (its files were written read-only). */
const chmod_writable = (folder: string): void => {
  if (!statSync(folder).isDirectory()) return
  chmodSync(folder, 0o700)
  for (const entry of readdirSync(folder, { withFileTypes: true }))
    if (entry.isDirectory()) chmod_writable(join(folder, entry.name))
}
