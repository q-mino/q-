// A frame (EXT-13, EXT-16, EXT-4, WEB-23; part 22.2): a slot or a page of an
// extension, placed by the kernel in its mark. Its document is the file of
// the extension's bundle, after the kernel's policy, in a frame sandboxed
// with scripts only (`frames/`). The kernel tells it its place once it is
// loaded (`placed`); it hears only the messages of that frame's window, each
// through the frame's fence, served only while the extension is active and
// the screen is the one shown: what is served her node carries out on the
// extension's leaves on `self`, its events posted back by the exchange's
// id, then `done`; what is refused goes to the kernel's trace. A frame acts
// with no tap the kernel can see: what it did is told under it, in the
// mark, as its extension's activity, never as her gesture. A screen hidden
// stops the flows it follows; a frame removed hears nothing more.

import { through_a_frames_fence } from '@q-mino/adapters-common'
import * as boundary from '@q-mino/boundary'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { createEffect, createSignal, For, on, onCleanup, onMount, Show, untrack } from 'solid-js'
import { the_document_of_a_frame, the_sandbox_of_a_frame } from '../frames/index.ts'
import type { AFrameServed, AnEventOfALeaf } from '../her_node/index.ts'
import { the_app, the_screen_is_shown, in_its_words, type AFrameToPlace } from './the_app.ts'

/** What a frame is told of its place (EXT-16): the boundary's form of `ui`'s place. */
const placed = (told: ui_value.a_place): boundary.a_message_to_a_frame =>
  boundary.a_message_to_a_frame.parse(
    told.place === 'a_bond'
      ? { message: 'placed', place: 'a_bond', data: { bond: told.bond } }
      : { message: 'placed', place: 'the_extension', data: {} },
  )

/** What a frame did: the leaf it invoked or followed, when (EXT-16). */
interface WhatItDid {
  readonly use_case: string
  readonly at: string
}

export const TheFrame = (props: {
  frame: AFrameToPlace
  told: ui_value.a_place
  active: boolean
}) => {
  const app = the_app()
  const shown = the_screen_is_shown()
  const frame = untrack(() => props.frame)
  const document = app.document_of(frame)
  /** Its title, from its extension's words for its label, or the fault of its missing (WEB-22). */
  const words = app.words(frame.extension)
  const title = in_its_words(
    app.common,
    frame.point === 'slot' ? words?.slots[frame.name] : words?.pages[frame.name],
    frame.name,
    app.common.the_points.the_frame,
  )
  const [did, set_did] = createSignal<readonly WhatItDid[]>([])
  const flows = new Set<AsyncIterator<AnEventOfALeaf>>()
  let element: HTMLIFrameElement | undefined

  const post = (message: boundary.a_message_to_a_frame): void => {
    element?.contentWindow?.postMessage(message, '*')
  }
  /** The flows in flight stopped: the frame hidden or removed (EXT-4). */
  const stops = (): void => {
    for (const flow of flows) void flow.return?.(undefined).catch(() => undefined)
    flows.clear()
  }
  /** A message served: its events posted back by its id, then `done`; a flow that fails ends with `done`. */
  const serves = async (served: AFrameServed): Promise<void> => {
    const flow = app.node.a_frame_asks(served)[Symbol.asyncIterator]()
    flows.add(flow)
    try {
      for (;;) {
        const next = await flow.next()
        if (next.done === true || !flows.has(flow)) break
        const event = boundary.an_event.safeParse(next.value)
        if (event.success) post({ message: 'event', id: served.id, event: event.data })
      }
    } catch {
      // A technical outcome of her node (EXT-15): the frame is told the flow ended.
    }
    if (flows.delete(flow)) post({ message: 'done', id: served.id })
  }
  /** A message of this frame's window, through the fence (EXT-4). */
  const hears = (event: MessageEvent<unknown>): void => {
    if (event.source === null || event.source !== element?.contentWindow) return
    const fenced = through_a_frames_fence({
      frame: { extension: frame.extension, shown: shown() },
      active: props.active,
      message: event.data,
      now: app.device.clock.now(),
    })
    if (fenced.fenced === 'refused') {
      app.node.a_frame_is_fenced(fenced.traced)
      return
    }
    set_did((before) => [
      ...before,
      { use_case: fenced.invokes.use_case, at: app.device.clock.now() },
    ])
    void serves(fenced)
  }
  onMount(() => {
    const view = element?.ownerDocument.defaultView
    if (view === undefined || view === null) return
    view.addEventListener('message', hears)
    onCleanup(() => {
      view.removeEventListener('message', hears)
      stops()
    })
  })
  createEffect(
    on(shown, (is_shown) => {
      if (!is_shown) stops()
    }),
  )
  return (
    <Show when={document} fallback={<p role="alert">{app.common.the_points.no_document}</p>}>
      {(it) => (
        <>
          <iframe
            ref={(it) => {
              element = it
            }}
            title={title}
            sandbox={the_sandbox_of_a_frame}
            srcdoc={the_document_of_a_frame(it())}
            style={{ width: '100%', border: '1px dashed' }}
            onLoad={() => {
              post(placed(props.told))
            }}
          />
          <Show when={did().length > 0}>
            <ul>
              <For each={did()}>
                {(one) => (
                  <li>
                    <small>
                      {app.common.the_points.it_did(
                        one.use_case,
                        one.at,
                        app.device.clock.time_zone,
                      )}
                    </small>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </>
      )}
    </Show>
  )
}
