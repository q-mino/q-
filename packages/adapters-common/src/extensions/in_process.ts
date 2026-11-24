import type { Transport } from './hosting.ts'

// An extension integrated, in the kernel's process (EXT-13; part 12.4 on the
// oracle, since 24 Nov 2026 the phone's too): its configurator loaded in the
// kernel's realm, the boundary still messages (EXT-2), each a JSON value
// copied both ways, so that the oracle and the phone speak one protocol and
// an isolated realm, when it comes, is another transport. Its side may come
// later, as the phone's composition root imports the extension's package
// when it is active: what the kernel sends meanwhile waits for it, in order;
// a side that never comes (its import failed) is its fall. An exception in
// its realm comes to the kernel as its fall (EXT-15). Unloaded, it neither
// hears nor speaks. [Q, C, 24 Nov 2026]

/** The extension's side, as its package gives it: it takes the kernel's messages (`boundary.the_extensions_side`). */
export interface AnExtensionsSide {
  readonly receive: (message: unknown) => Promise<void>
}

/** The extension, loaded with how it speaks to the kernel: its side now, or once its package is imported. */
export type AnExtensionInProcess = (
  send: (message: unknown) => void,
) => AnExtensionsSide | Promise<AnExtensionsSide>

/** A message as it crosses: a JSON value, copied. */
const copied = (message: unknown): unknown => JSON.parse(JSON.stringify(message))

/** An error's message, or the value's text. */
const why = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/** The side's state, an ADT: still coming, with what waits for it; here; or unloaded. */
type TheSide =
  | { readonly side: 'coming'; readonly waiting: unknown[] }
  | { readonly side: 'here'; readonly realm: AnExtensionsSide }
  | { readonly side: 'unloaded' }

/** The transport to an extension loaded in process (EXT-13): every message copied as JSON; its exceptions, its fall. */
export const in_process =
  (extension: AnExtensionInProcess): Transport =>
  (to_the_kernel) => {
    let state: TheSide = { side: 'coming', waiting: [] }
    const speaks = (message: unknown): void => {
      if (state.side !== 'unloaded') to_the_kernel(copied(message))
    }
    const falls = (error: unknown): void => {
      speaks({ message: 'fallen', why: why(error) })
    }
    const hands = (realm: AnExtensionsSide, message: unknown): void => {
      realm.receive(copied(message)).catch(falls)
    }
    const arrives = (realm: AnExtensionsSide): void => {
      if (state.side !== 'coming') return
      const waiting = state.waiting
      state = { side: 'here', realm }
      for (const message of waiting) hands(realm, message)
    }
    const loaded = extension(speaks)
    if (loaded instanceof Promise) loaded.then(arrives, falls)
    else arrives(loaded)
    return {
      to_the_extension: (message) => {
        switch (state.side) {
          case 'unloaded':
            return
          case 'coming':
            state.waiting.push(message)
            return
          case 'here':
            hands(state.realm, message)
        }
      },
      unload: () => {
        state = { side: 'unloaded' }
      },
    }
  }
