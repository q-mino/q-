import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import {
  a_copy_made,
  holds_a_word_of,
  the_allow_list,
  the_documents_of,
  the_words_in,
} from '../src/copy/index.ts'

// The copy (AST-11; README story 25): over a fixture folder, the project's
// notes of the allow-list only, each left out whole when it holds a word
// never copied, its path told; the repository's documents, never an
// agent's rules; swapped whole, the older copy removed.

const folders: string[] = []
afterAll(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true })
})
const a_folder = (): string => {
  const folder = mkdtempSync(join(tmpdir(), 'cumino-copy-'))
  folders.push(folder)
  return folder
}
const written = (path: string, text: string): void => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
}

/** The files under a folder, by their paths in it. */
const the_files_in = (folder: string, under = ''): readonly string[] =>
  readdirSync(join(folder, under), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? the_files_in(folder, join(under, entry.name)) : [join(under, entry.name)],
  )

describe('the copy', () => {
  test('an allowed note with a word never copied: left out, its path told once; a note not on the list never copied', () => {
    const root = a_folder()
    const source = join(root, 'progetto')
    const repository = join(root, 'repo')
    for (const note of the_allow_list) written(join(source, note), `# ${note}\n`)
    written(join(source, 'galateo.md'), '# Galateo\nNe parla Zelinda, a cena.\n')
    written(join(source, 'flussi.md'), '# Flussi\nIl laptop: /home/qualcuno/.\n')
    written(join(source, 'racconto.md'), '# Racconto\nZelindamente: non è un nome.\n')
    written(join(source, 'scenari.md'), '# Scenari\nNiente di personale.\n')
    written(join(source, 'log.md'), '# Log\n')
    written(join(source, 'richieste', '2026-11-28-x.md'), '# Una richiesta\n')
    written(join(source, 'CLAUDE.md'), '# Regole\n')
    written(join(repository, 'README.md'), '# q-\n')
    written(join(repository, 'CLAUDE.md'), '# rules\n')
    written(join(repository, 'docs', 'architecture.md'), '# Architecture\n')
    written(join(repository, 'docs', 'CLAUDE.md'), '# rules\n')
    written(join(repository, 'packages', 'relay', 'README.md'), '# relay\n')
    written(join(repository, 'packages', 'relay', 'node_modules', 'x', 'README.md'), '# x\n')
    written(join(repository, 'packages', 'relay', '.claude', 'README.md'), '# x\n')
    written(join(root, 'never-copied.txt'), '# the family\nZelinda\n\n')
    const copies = join(root, 'copies')
    const first = a_copy_made(
      { source, repository, never_copied: the_words_in(join(root, 'never-copied.txt')) },
      copies,
      '1',
    )
    expect(first.left_out).toEqual(['galateo.md', 'flussi.md'])
    expect(first.missing).toEqual([])
    expect(first.files).toBe(the_allow_list.length - 2 + 3)
    const files = the_files_in(first.folder)
    expect(files).toContain(join('progetto', 'racconto.md'))
    expect(files).toContain(join('progetto', 'import', 'vocabolario.md'))
    expect(files).not.toContain(join('progetto', 'scenari.md'))
    expect(files.filter((path) => path.startsWith('repo'))).toEqual([
      join('repo', 'README.md'),
      join('repo', 'docs', 'architecture.md'),
      join('repo', 'packages', 'relay', 'README.md'),
    ])
    expect(statSync(join(first.folder, 'progetto', 'racconto.md')).mode & 0o222).toBe(0)
    expect(readFileSync(join(first.folder, 'progetto', 'definizione.md'), 'utf8')).toBe(
      '# definizione.md\n',
    )
    // Made again: swapped whole, the older one removed.
    const second = a_copy_made({ source, repository, never_copied: ['Zelinda'] }, copies, '2')
    expect(readdirSync(copies)).toEqual(['2'])
    expect(second.files).toBe(first.files)
  })

  test('the words never copied: a word of letters whole, whatever its case; any other as written, anywhere', () => {
    const holds = holds_a_word_of(['IAM', 'quota', 'Zelinda', '/home/', '€'])
    expect(holds('il ruolo iam di aws')).toBe(true)
    expect(holds('chiamare un amico')).toBe(false)
    expect(holds('la quota di Max')).toBe(true)
    expect(holds('quotazione')).toBe(false)
    expect(holds('ZELINDA.')).toBe(true)
    expect(holds('costa 5 €')).toBe(true)
    expect(holds('/home/a')).toBe(true)
    expect(holds('home')).toBe(false)
  })

  test('the repository’s documents, from this checkout: its README, docs and the packages’ READMEs, never an agent’s rules', () => {
    const documents = the_documents_of(join(import.meta.dirname, '..', '..', '..'))
    expect(documents).toContain('README.md')
    expect(documents).toContain(join('docs', 'architecture.md'))
    expect(documents).toContain(join('packages', 'assistant', 'README.md'))
    expect(documents.some((path) => path.includes('CLAUDE') || path.includes('node_modules'))).toBe(
      false,
    )
  })
})
