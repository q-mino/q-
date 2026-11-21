// @vitest-environment happy-dom
import { afterEach, describe, expect, test } from 'vitest'
import {
  a_realm_in_a_frame,
  the_document_of_a_realm,
  the_policy_of_a_frame,
  the_script_inline,
} from '../../src/index.ts'

// An extension's realm in a frame (PWA-3), in happy-dom: its frame has a
// window the kernel posts to and a test posts from, but runs no script (the
// realm's script runs in a browser: the preview of step 25, the phones at 27).

afterEach(() => {
  document.body.replaceChildren()
})

const the_frame = (): HTMLIFrameElement => {
  const frame = document.querySelector('iframe')
  if (frame === null) throw new Error('no frame')
  return frame
}

const the_window_of = (frame: HTMLIFrameElement): Window => {
  const view = frame.contentWindow
  if (view === null) throw new Error('the frame has no window')
  return view
}

describe('an extension’s realm in a frame', () => {
  test('its frame is hidden, sandboxed with scripts only, its document the kernel’s policy then its script', () => {
    a_realm_in_a_frame({ document })('console.log("ready")')(() => undefined)
    const frame = the_frame()
    expect(frame.hidden).toBe(true)
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame.srcdoc).toBe(
      `<!doctype html><meta http-equiv="Content-Security-Policy" content="${the_policy_of_a_frame}"><script>console.log("ready")</script>`,
    )
  })

  test('a script’s `</script` cannot end its element', () => {
    expect(the_script_inline('const end = "</script>"')).toBe('const end = "<\\/script>"')
    expect(the_document_of_a_realm('x("</script>")')).toContain('<script>x("<\\/script>")</script>')
  })

  test('the kernel hears only its frame’s window; what it sends waits for the frame’s load, in order', () => {
    const heard: unknown[] = []
    const realm = a_realm_in_a_frame({ document })('')((message) => {
      heard.push(message)
    })
    const frame = the_frame()
    const posted: unknown[] = []
    the_window_of(frame).addEventListener('message', (event) => {
      posted.push(event.data)
    })
    window.dispatchEvent(
      new MessageEvent('message', { data: { message: 'ready' }, source: the_window_of(frame) }),
    )
    window.dispatchEvent(
      new MessageEvent('message', { data: { message: 'ready' }, source: window }),
    )
    expect(heard).toEqual([{ message: 'ready' }])
    realm.to_the_extension({ message: 'start' })
    realm.to_the_extension({ message: 'stop' })
    expect(posted).toEqual([])
    frame.dispatchEvent(new Event('load'))
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(posted).toEqual([{ message: 'start' }, { message: 'stop' }])
        resolve()
      }, 50)
    })
  })

  test('unloaded, its frame is removed, and it neither hears nor is told anything more', () => {
    const heard: unknown[] = []
    const realm = a_realm_in_a_frame({ document })('')((message) => {
      heard.push(message)
    })
    const frame = the_frame()
    const its_window = the_window_of(frame)
    realm.unload()
    expect(document.querySelector('iframe')).toBeNull()
    window.dispatchEvent(
      new MessageEvent('message', { data: { message: 'ready' }, source: its_window }),
    )
    realm.to_the_extension({ message: 'start' })
    expect(heard).toEqual([])
  })
})
