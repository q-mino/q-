// The note of a request (AST-12): written by the node from the answer's
// `note`, in the project's `richieste/` (a setting), named by the day, the
// title's words and six hex of the turn's identity hashed, written whole (a
// temporary file renamed), the same after a fall (a note already there is
// left as it is). Its frontmatter the vault's [Q, C, provisional: A to
// confirm]; no name, no bond, no time but the day, no sentence of the
// writer's (the answerer's words, AST-10).

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ANote } from '../answerer/index.ts'

/** The kind of a note as the body and the tags tell it (AST-12). */
const the_kind: Readonly<Record<ANote['kind'], { readonly told: string; readonly tag: string }>> = {
  idea: { told: 'idea', tag: 'idea' },
  feature_request: { told: 'richiesta di funzionalità', tag: 'funzionalita' },
  problem: { told: 'problema', tag: 'problema' },
  question: { told: 'domanda per il progetto', tag: 'domanda' },
}

/** The title's words in ASCII, lower case, joined by `-`, at most 50 characters. */
export const the_words_of = (title: string): string => {
  const words = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const cut = words.slice(0, 50).replace(/-+$/g, '')
  return cut === '' ? 'richiesta' : cut
}

/** Six hex of a turn's identity hashed (SHA-256). */
export const six_hex_of = (identity: string): string =>
  createHash('sha256').update(identity).digest('hex').slice(0, 6)

/** A text as a YAML string in double quotes. */
const quoted = (text: string): string => JSON.stringify(text)

/** One line of a text: its line breaks as spaces. */
const one_line = (text: string): string => text.replace(/\s*\n\s*/g, ' ').trim()

/** The note's Markdown (AST-12). */
export const the_note_s_text = (note: ANote, day: string): string => {
  const kind = the_kind[note.kind]
  return [
    '---',
    `title: ${quoted(`q- - richiesta: ${one_line(note.title)}`)}`,
    'type: note',
    'owner: claude',
    'domain: tech',
    'status: draft',
    `status_note: "salvata dall'assistente di Cumino su richiesta di chi scriveva: anonima e riformulata; da vagliare"`,
    'confidence: inferred',
    'source: derived',
    'style: prose',
    `tags: [progetto, q, richiesta, assistente, ${kind.tag}]`,
    `created: ${day}`,
    `updated: ${day}`,
    'reviewed: ',
    'related: ["[[projects/q/index]]"]',
    '---',
    `# ${one_line(note.title)}`,
    '',
    `**Tipo**: ${kind.told}`,
    '',
    '## La richiesta',
    '',
    note.request.trim(),
    '',
    '## Il contesto',
    '',
    note.context.trim() === '' ? '—' : note.context.trim(),
    '',
  ].join('\n')
}

/** The note's file name (AST-12). */
export const the_note_s_name = (note: ANote, day: string, identity: string): string =>
  `${day}-${the_words_of(note.title)}-${six_hex_of(identity)}.md`

/** A note written into the notes' folder, once: its name. */
export const a_note_written = (
  folder: string,
  note: ANote,
  day: string,
  identity: string,
): string => {
  const name = the_note_s_name(note, day, identity)
  const path = join(folder, name)
  if (existsSync(path)) return name
  mkdirSync(folder, { recursive: true })
  const temporary = join(folder, `.${name}.writing`)
  writeFileSync(temporary, the_note_s_text(note, day), { mode: 0o644 })
  renameSync(temporary, path)
  return name
}
