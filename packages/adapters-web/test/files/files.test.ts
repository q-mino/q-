import { describe, expect, test } from 'vitest'
import {
  a_saved_file_s_minute,
  pick_a_file,
  save_a_file,
  type AFile,
  type AFileInput,
} from '../../src/index.ts'

// Files for export and import (WEB-3): a file saved through a link the page
// clicks, its blob let go after a minute; a file picked, read, or nothing.

const an_export: AFile = {
  name: 'cumino-anna.json',
  type: 'application/json',
  content: new TextEncoder().encode('{"faces":[]}'),
}

/** A page that records what saving a file does with it. */
const a_page_to_save_in = () => {
  const blobs = new Map<string, Blob>()
  const clicked: { href: string; download: string }[] = []
  const let_go: string[] = []
  const waited: number[] = []
  return {
    page: {
      document: {
        createElement: (_tag: 'a') => {
          const link = {
            href: '',
            download: '',
            click: () => clicked.push({ href: link.href, download: link.download }),
          }
          return link
        },
      },
      urls: {
        createObjectURL: (blob: Blob) => {
          const address = `blob:https://cumino.example/${String(blobs.size)}`
          blobs.set(address, blob)
          return address
        },
        revokeObjectURL: (address: string) => let_go.push(address),
      },
      elapsed: (milliseconds: number) => {
        waited.push(milliseconds)
        return Promise.resolve()
      },
    },
    blobs,
    clicked,
    let_go,
    waited,
  }
}

describe('saving a file', () => {
  test('gives the browser its bytes, its type and its name, through a link the page clicks', async () => {
    const saving = a_page_to_save_in()
    save_a_file(saving.page)(an_export)
    expect(saving.clicked).toEqual([
      { href: 'blob:https://cumino.example/0', download: an_export.name },
    ])
    const blob = saving.blobs.get('blob:https://cumino.example/0')
    expect(blob?.type).toBe(an_export.type)
    expect(new Uint8Array((await blob?.arrayBuffer()) ?? new ArrayBuffer(0))).toEqual(
      an_export.content,
    )
  })

  test("lets the blob's address go after a minute", async () => {
    const saving = a_page_to_save_in()
    save_a_file(saving.page)(an_export)
    expect(saving.waited).toEqual([a_saved_file_s_minute])
    await Promise.resolve()
    expect(saving.let_go).toEqual(['blob:https://cumino.example/0'])
  })
})

/** A page whose file input does, when clicked, what the user does in the picker. */
const a_page_to_pick_in = (
  user: (input: { readonly fire: (type: 'change' | 'cancel') => void }) => {
    readonly files: AFileInput['files']
  },
) => {
  const inputs: { type: string; accept: string }[] = []
  return {
    page: {
      document: {
        createElement: (_tag: 'input'): AFileInput => {
          const listeners = new Map<string, () => void>()
          let files: AFileInput['files'] = null
          const input: AFileInput = {
            type: '',
            accept: '',
            get files() {
              return files
            },
            addEventListener: (type, listener) => listeners.set(type, listener),
            click: () => {
              inputs.push({ type: input.type, accept: input.accept })
              files = user({ fire: (type) => listeners.get(type)?.() }).files
            },
          }
          return input
        },
      },
    },
    inputs,
  }
}

const a_file_chosen = (file: AFile) => ({
  name: file.name,
  type: file.type,
  arrayBuffer: () => Promise.resolve(file.content.buffer),
})

describe('picking a file', () => {
  test('opens the picker for the types asked, and gives the file chosen with its bytes', async () => {
    const picking = a_page_to_pick_in((input) => {
      queueMicrotask(() => {
        input.fire('change')
      })
      return { files: [a_file_chosen(an_export)] }
    })
    const picked = await pick_a_file(picking.page)(['application/json', '.json'])
    expect(picking.inputs).toEqual([{ type: 'file', accept: 'application/json,.json' }])
    expect(picked).toEqual({ picked: 'a_file', file: an_export })
  })

  test('gives nothing when the picker closes, or nothing is chosen', async () => {
    const closing = a_page_to_pick_in((input) => {
      queueMicrotask(() => {
        input.fire('cancel')
      })
      return { files: null }
    })
    expect(await pick_a_file(closing.page)(['.json'])).toEqual({ picked: 'nothing' })
    const choosing_none = a_page_to_pick_in((input) => {
      queueMicrotask(() => {
        input.fire('change')
      })
      return { files: [] }
    })
    expect(await pick_a_file(choosing_none.page)(['.json'])).toEqual({ picked: 'nothing' })
  })

  test('says so when the browser cannot read the file chosen', async () => {
    const picking = a_page_to_pick_in((input) => {
      queueMicrotask(() => {
        input.fire('change')
      })
      return {
        files: [
          {
            name: 'gone.json',
            type: 'application/json',
            arrayBuffer: () => Promise.reject(new DOMException('gone', 'NotReadableError')),
          },
        ],
      }
    })
    expect(await pick_a_file(picking.page)(['.json'])).toEqual({
      picked: 'a_file_that_cannot_be_read',
      name: 'gone.json',
    })
  })
})
