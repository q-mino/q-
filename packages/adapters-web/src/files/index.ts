// Files for export and import (WEB-3; ADP-1): a file given to the user to
// keep, a file the user picks. Their bytes only: what an export holds and
// how an import is read are the configurator's and its step's (26). The
// page's objects are the configurator's to give (`document`, `URL`), so
// that nothing here reaches for a global. No server: the file stays on the
// device.

import type * as zz from '@q-mino/domains/library'

/** A file of the user's: its name, its media type, its bytes. */
export interface AFile {
  readonly name: string
  readonly type: string
  readonly content: Uint8Array<ArrayBuffer>
}

/** What the page gives to save a file: a link to click, the addresses of the browser's blobs, the time that passes. */
export interface APageToSaveIn {
  readonly document: {
    createElement(tag: 'a'): { href: string; download: string; click(): void }
  }
  readonly urls: {
    createObjectURL(blob: Blob): string
    revokeObjectURL(url: string): void
  }
  readonly elapsed: zz.Elapsed
}

/** How long a saved file's blob is kept for the browser to write it: a minute. */
export const a_saved_file_s_minute = 60_000

/**
 * Save a file: the browser writes it where the user keeps downloads, under
 * its name, through a link the page clicks (a gesture of the user's must be
 * on the way, as for any download); the blob's address let go after a
 * minute.
 */
export const save_a_file =
  (page: APageToSaveIn) =>
  (file: AFile): void => {
    const address = page.urls.createObjectURL(new Blob([file.content], { type: file.type }))
    const link = page.document.createElement('a')
    link.href = address
    link.download = file.name
    link.click()
    void page.elapsed(a_saved_file_s_minute).then(() => {
      page.urls.revokeObjectURL(address)
    })
  }

/** What the user picked: a file, nothing (the picker closed), or a file the browser could not read. */
export type APick =
  | { readonly picked: 'a_file'; readonly file: AFile }
  | { readonly picked: 'nothing' }
  | { readonly picked: 'a_file_that_cannot_be_read'; readonly name: string }

/** The parts of a file input a pick uses. */
export interface AFileInput {
  type: string
  accept: string
  readonly files: ArrayLike<{
    readonly name: string
    readonly type: string
    arrayBuffer(): Promise<ArrayBuffer>
  }> | null
  addEventListener(
    type: 'change' | 'cancel',
    listener: () => void,
    options: { readonly once: true },
  ): void
  click(): void
}

/** What the page gives to pick a file: a file input. */
export interface APageToPickIn {
  readonly document: { createElement(tag: 'input'): AFileInput }
}

/**
 * Pick a file of these media types or extensions (`accept`, as the browser
 * reads it): the browser's picker opens (a gesture of the user's must be on
 * the way), and the pick is the file chosen, read, or nothing when the
 * picker closes. A browser that tells no closing (no `cancel` event, before
 * 2023) leaves the pick waiting; the next pick is a new one.
 */
export const pick_a_file =
  (page: APageToPickIn) =>
  (accept: readonly string[]): Promise<APick> =>
    new Promise((resolve) => {
      const input = page.document.createElement('input')
      input.type = 'file'
      input.accept = accept.join(',')
      input.addEventListener(
        'change',
        () => {
          const chosen = input.files?.[0]
          if (chosen === undefined) {
            resolve({ picked: 'nothing' })
            return
          }
          chosen.arrayBuffer().then(
            (buffer) => {
              resolve({
                picked: 'a_file',
                file: { name: chosen.name, type: chosen.type, content: new Uint8Array(buffer) },
              })
            },
            () => {
              resolve({ picked: 'a_file_that_cannot_be_read', name: chosen.name })
            },
          )
        },
        { once: true },
      )
      input.addEventListener(
        'cancel',
        () => {
          resolve({ picked: 'nothing' })
        },
        { once: true },
      )
      input.click()
    })
