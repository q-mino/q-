import type { Transport } from '@q-mino/adapters-common'

// An extension in process, on the oracle (EXT-13; part 12.4): its
// configurator imported in the kernel's realm, the boundary still messages,
// each a JSON value copied both ways, so that the oracle and the phone speak
// one protocol. An exception in its realm comes to the kernel as its fall.
// Unloaded, it neither hears nor speaks.

/** The extension's side, as its package gives it: loaded with how it speaks to the kernel, it takes the kernel's messages (`boundary.the_extensions_side`). */
export type AnExtensionInProcess = (send: (message: unknown) => void) => {
  readonly receive: (message: unknown) => Promise<void>
}

/** A message as it crosses: a JSON value, copied. */
const copied = (message: unknown): unknown => JSON.parse(JSON.stringify(message))

/** An error's message, or the value's text. */
const why = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/** The transport to an extension loaded in process (EXT-13): every message copied as JSON; its exceptions, its fall. */
export const in_process =
  (extension: AnExtensionInProcess): Transport =>
  (to_the_kernel) => {
    let loaded = true
    const speaks = (message: unknown): void => {
      if (loaded) to_the_kernel(copied(message))
    }
    const realm = extension(speaks)
    return {
      to_the_extension: (message) => {
        if (!loaded) return
        realm.receive(copied(message)).catch((error: unknown) => {
          speaks({ message: 'fallen', why: why(error) })
        })
      },
      unload: () => {
        loaded = false
      },
    }
  }
