// A part of an extension's, drawn (EXT-16, K-3, WEB-23; part M4 of
// messaging): the component its module exports, imported when first drawn,
// given its place with the place's data, where it is (in its place, on the
// whole screen), whether its screen is the one shown, and its door to the
// kernel. Each invocation and each follow through the door is a message of
// a part's (EXT-2), through the kernel's fence (`through_a_parts_fence`,
// EXT-4: its own extension's leaves on `self`, the extension active, its
// screen shown), then asked of her node (`a_part_asks`); a refusal goes to
// the kernel's trace (`a_part_is_fenced`). The follows it opened are ended
// by the kernel once it is no longer shown (its screen under another, or
// gone), at once for the part, and in the extension at the flow's next
// event (K-4). A part the app does not carry, a module that does not load,
// or a part that falls while drawn, is the app's fault in its place, the
// rest of the screen drawn. [Q, C, high impact: A to discuss] (26–27 Nov 2026)

import { useSignal } from '@preact/signals'
import { through_a_parts_fence } from '@q-mino/adapters-common'
import * as boundary from '@q-mino/boundary'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { Component, type ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { Notice, type WhereASlotIs } from '../design/index.ts'
import {
  the_app,
  the_screen_is_shown,
  type APartsComponent,
  type APointWithAPart,
  type TheApp,
} from './the_app.ts'

/** A part's module as it is drawn: loading, loaded with its component, not carried by the app, or not loaded (the network). */
type APartLoaded =
  | { readonly is: 'loading' }
  | { readonly is: 'loaded'; readonly component: APartsComponent }
  | { readonly is: 'not_carried' }
  | { readonly is: 'not_loaded' }

/** The place a mark is told, as the boundary tells a part (EXT-2's `placed`): the bond on a bond's screen and on its row, nothing on the extension's own. */
export const the_place_told = (told: ui_value.a_place): boundary.a_place_with_its_data => {
  switch (told.place) {
    case 'a_bond':
    case 'a_bond_in_my_contacts':
      return boundary.a_place_with_its_data.parse({ place: told.place, data: { bond: told.bond } })
    case 'the_extension':
      return { place: 'the_extension', data: {} }
  }
}

/**
 * A flow the part reads, ended at once when the part stops it (`break`,
 * `return()`) or the kernel ends it (`ending`): its source is told to end
 * without waiting for it, since a source waiting for its next event ends
 * only then (K-4's limit), and `forget` drops it from the flows open.
 */
const ended_at_once = <T,>(
  source: AsyncIterator<T>,
  ending: Promise<void>,
  forget: () => void,
): AsyncIterableIterator<T> => {
  let over = false
  const ends = (): IteratorReturnResult<undefined> => {
    if (!over) {
      over = true
      forget()
      // Not awaited: the source ends at its next event; what it says then is dropped.
      source.return?.().catch(() => undefined)
    }
    return { done: true, value: undefined }
  }
  const ended = ending.then(() => 'ended' as const)
  const flow: AsyncIterableIterator<T> = {
    next: async () => {
      if (over) return { done: true, value: undefined }
      const next = await Promise.race([source.next(), ended])
      if (next === 'ended') return ends()
      if (next.done === true) {
        over = true
        forget()
      }
      return next
    },
    return: () => Promise.resolve(ends()),
    [Symbol.asyncIterator]: () => flow,
  }
  return flow
}

/** The flows a part opened, ended together by the kernel (its screen no longer shown, or the part gone). */
interface TheFlowsOpen {
  readonly opens: <T>(source: AsyncIterator<T>) => AsyncIterableIterator<T>
  readonly ends_them: () => void
}

const the_flows_open = (): TheFlowsOpen => {
  const open = new Set<() => void>()
  return {
    opens: (source) => {
      let end = (): void => undefined
      const ending = new Promise<void>((resolve) => {
        end = resolve
      })
      open.add(end)
      return ended_at_once(source, ending, () => open.delete(end))
    },
    ends_them: () => {
      for (const end of [...open]) end()
    },
  }
}

/**
 * One exchange of a part's through the kernel (EXT-4, EXT-2): its message,
 * its id drawn by the kernel (it pairs the exchange only), through the
 * fence; refused, traced and told `not_served`; served, her node's events in
 * order, each as the boundary carries it, or `not_served` when the extension
 * cannot be reached (not running, fallen: the kernel tells it in its mark).
 */
async function* an_exchange(
  app: TheApp,
  part: { readonly extension: string; readonly shown: () => boolean },
  exchange: 'invoke' | 'follow',
  asked: boundary.WhatAPartAsks,
): AsyncGenerator<boundary.WhatAPartIsTold> {
  const active = (await app.node.the_extensions()).some(
    (one) => one.extension === part.extension && one.is === 'active',
  )
  const fenced = through_a_parts_fence({
    part: { extension: part.extension, shown: part.shown() },
    active,
    message: {
      message: exchange,
      id: app.device.draws_an_id(),
      use_case: asked.use_case,
      version: asked.version,
      input: asked.input,
    },
    now: app.device.clock.now(),
  })
  if (fenced.fenced === 'refused') {
    app.node.a_part_is_fenced(fenced.traced)
    yield { told: 'not_served', because: 'the_kernels_fence' }
    return
  }
  try {
    for await (const event of app.node.a_part_asks(fenced)) {
      yield { told: 'an_event', event: boundary.an_event.parse(event) }
    }
  } catch {
    // The extension cannot be reached (not running, fallen; EXT-15): the kernel tells it in its mark.
    yield { told: 'not_served', because: 'the_extension_cannot_be_reached' }
  }
}

/** A part's door (EXT-16): each call an exchange through the kernel, its flow among those the kernel ends once the part is no longer shown. */
const a_door = (
  app: TheApp,
  part: { readonly extension: string; readonly shown: () => boolean },
  flows: TheFlowsOpen,
): boundary.APartsDoor => ({
  invoke: (asked) => flows.opens(an_exchange(app, part, 'invoke', asked)),
  follow: (asked) => flows.opens(an_exchange(app, part, 'follow', asked)),
})

/**
 * What a part that falls while drawn leaves (K-3): the app's fault in its
 * place, the rest of the screen drawn. Preact catches a component's fall
 * only in a class's `componentDidCatch`, so this one is a class.
 */
class WhereAPartMayFall extends Component<{ fell: ComponentChildren; children: ComponentChildren }> {
  override state: { readonly fell: boolean } = { fell: false }
  override componentDidCatch(): void {
    this.setState({ fell: true })
  }
  override render() {
    return this.state.fell ? this.props.fell : this.props.children
  }
}

/** A slot or a page whose part the app does not carry (WEB-23): the app's fault, never a blank. */
export const APartNotDrawn = () => {
  const app = the_app()
  return <Notice kind="fault">{app.common.the_points.no_document}</Notice>
}

/**
 * A part of an extension's at a place (K-3): imported once, then drawn with
 * what the kernel gives it; its follows ended once its screen is no longer
 * the one shown, and when it is gone.
 */
export const APart = (props: {
  extension: string
  point: APointWithAPart
  told: ui_value.a_place
  where: WhereASlotIs
}) => {
  const app = the_app()
  const shown = the_screen_is_shown()
  const loaded = useSignal<APartLoaded>({ is: 'loading' })
  const flows = useRef<TheFlowsOpen | null>(null)
  flows.current ??= the_flows_open()
  const door = useRef<boundary.APartsDoor | null>(null)
  door.current ??= a_door(
    app,
    { extension: props.extension, shown: () => shown.peek() },
    flows.current,
  )
  useEffect(() => {
    const carried = app.parts(props.extension, props.point)
    if (carried.part === 'not_carried') {
      loaded.value = { is: 'not_carried' }
      return
    }
    let here = true
    carried.imports().then(
      (component) => {
        if (here) loaded.value = { is: 'loaded', component }
      },
      () => {
        if (here) loaded.value = { is: 'not_loaded' }
      },
    )
    return () => {
      here = false
    }
  }, [])
  // The follows it opened end once its screen is not the one shown, and when it is gone (K-4).
  useEffect(() => {
    const ended = flows.current
    const stops = shown.subscribe((is) => {
      if (!is) ended?.ends_them()
    })
    return () => {
      stops()
      ended?.ends_them()
    }
  }, [])
  const is = loaded.value
  switch (is.is) {
    case 'loading':
      return null
    case 'not_carried':
      return <APartNotDrawn />
    case 'not_loaded':
      return <Notice kind="fault">{app.common.the_points.the_part_does_not_load}</Notice>
    case 'loaded': {
      const Part = is.component
      return (
        <div class="a-part" data-extension={props.extension} data-point={props.point.name}>
          <WhereAPartMayFall
            fell={<Notice kind="fault">{app.common.the_points.the_part_fell}</Notice>}
          >
            <Part
              placed={the_place_told(props.told)}
              where={props.where}
              shown={shown.value}
              door={door.current}
            />
          </WhereAPartMayFall>
        </div>
      )
    }
  }
}
