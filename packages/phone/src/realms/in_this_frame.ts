// An extension's realm in the frame the kernel placed it in (EXT-13, PWA-3):
// the extension's side of the boundary, as its package gives it, wired to
// the frame's window. It hears the messages of the page that placed it
// (its parent) only, and speaks to it alone; a message its side throws on,
// an error or a rejection nobody handled in its realm, is its fall (EXT-15),
// told the kernel, which loads it again once. This module runs inside the
// frame, bundled with the extension by the phone's build: it reaches nothing
// of the node but these messages.

/** An extension's side of the boundary, as its package gives it: given how to speak to the kernel, how it hears it. */
export type AnExtensionsSide = (send: (message: unknown) => void) => {
  readonly receive: (message: unknown) => Promise<void>
}

const why_of = (fault: unknown): string => (fault instanceof Error ? fault.message : String(fault))

/** The realm in this frame, its window and its parent's given. */
export const a_realm_in_this_frame = (frame: Window, side: AnExtensionsSide): void => {
  const the_kernel = frame.parent
  const speaks = (message: unknown): void => {
    the_kernel.postMessage(message, '*')
  }
  const falls = (fault: unknown): void => {
    speaks({ message: 'fallen', why: why_of(fault) })
  }
  frame.addEventListener('error', (event) => {
    falls(event.error ?? event.message)
  })
  frame.addEventListener('unhandledrejection', (event) => {
    falls(event.reason)
  })
  const realm = side(speaks)
  frame.addEventListener('message', (event) => {
    if (event.source !== the_kernel) return
    realm.receive(event.data).catch(falls)
  })
}
