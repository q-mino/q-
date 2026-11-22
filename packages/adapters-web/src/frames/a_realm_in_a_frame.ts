import type { Transport } from '@q-mino/adapters-common'
import { the_document_of_a_frame, the_sandbox_of_a_frame } from './the_document_of_a_frame.ts'

// An extension's realm in a frame of its own (EXT-13, EXT-15; step 25,
// PWA-3): the kernel's side of the boundary reaches it through a transport
// (EXT-2, the hosting's `Transport`), as it reaches a realm in process on
// the oracle. The frame is the kernel's: hidden, sandboxed with scripts only
// (an opaque origin: no storage, no cookie, no service worker of the app's),
// its document the kernel's policy first and then the extension's realm, one
// inline script its build made (its configurator wired to the frame's
// window), so that it speaks to the node only by messages. The page is given
// (WEB-5): the document the frame is added to, whose view hears it. A message
// is heard only from that frame's window, and handed as it came: the hosting
// parses it by the boundary's schema (EXT-2), a claim of the extension's
// (F2). What the kernel sends before the frame has loaded waits for its
// load, in order (the realm's script has run by then: it listens). Unloaded,
// the frame is removed and neither heard nor told anything more.
// [Q, C, 21 Nov 2026]

/** A realm's document (PWA-3): the kernel's policy, then the realm's script, its `</script` written so that no text of the script ends the element. */
export const the_document_of_a_realm = (script: string): string =>
  the_document_of_a_frame(`<script>${the_script_inline(script)}</script>`)

/**
 * A script as it can be written inline: every `</script` written `<\/script`,
 * which reads the same in a JavaScript string, template, regular expression
 * or comment, the only places a script can hold it. The hash of the app's
 * policy is of this text (PWA-4).
 */
export const the_script_inline = (script: string): string =>
  script.replaceAll('</script', '<\\/script')

/**
 * The page's document, by the parts a realm's frame uses (WEB-5, WEB-21):
 * its window, which hears the frame; an iframe made; its body, which holds
 * it. The browser's document is given as it is; a test with no realm, a
 * document of its own.
 */
export interface ARealmsDocument {
  readonly defaultView: Pick<Window, 'addEventListener' | 'removeEventListener'> | null
  createElement(tag: 'iframe'): HTMLIFrameElement
  readonly body: { append(frame: HTMLIFrameElement): void }
}

/** Where a realm's frame is placed: the page's document (WEB-5). */
export interface ThePageOfTheRealms {
  readonly document: ARealmsDocument
}

/** A transport to an extension's realm in a hidden frame of the page, its script the realm its build made. */
export const a_realm_in_a_frame =
  (page: ThePageOfTheRealms) =>
  (script: string): Transport =>
  (to_the_kernel) => {
    const document = page.document
    const view = document.defaultView
    if (view === null) throw new Error('a document with no window places no realm')
    const frame = document.createElement('iframe')
    frame.hidden = true
    frame.setAttribute('aria-hidden', 'true')
    frame.setAttribute('sandbox', the_sandbox_of_a_frame)
    frame.srcdoc = the_document_of_a_realm(script)
    let state: 'loading' | 'loaded' | 'unloaded' = 'loading'
    const waiting: unknown[] = []
    const posted = (message: unknown): void => {
      frame.contentWindow?.postMessage(message, '*')
    }
    const hears = (event: MessageEvent): void => {
      if (state === 'unloaded' || event.source === null || event.source !== frame.contentWindow)
        return
      to_the_kernel(event.data)
    }
    const loads = (): void => {
      if (state !== 'loading') return
      state = 'loaded'
      for (const message of waiting.splice(0)) posted(message)
    }
    frame.addEventListener('load', loads)
    view.addEventListener('message', hears)
    document.body.append(frame)
    return {
      to_the_extension: (message) => {
        if (state === 'unloaded') return
        if (state === 'loading') {
          waiting.push(message)
          return
        }
        posted(message)
      },
      unload: () => {
        state = 'unloaded'
        waiting.splice(0)
        view.removeEventListener('message', hears)
        frame.removeEventListener('load', loads)
        frame.remove()
      },
    }
  }
