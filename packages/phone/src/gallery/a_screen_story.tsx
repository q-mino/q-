// A story of a screen (WEB-28, WEB-29): the app's screens (`TheScreens`)
// opened on a node of a story, with the phone's words, and her gestures
// played on them until they show the story's case, as the tests of
// `phone/test/screens` play them. Each frame of the gallery (Roano,
// Lavagna) its own node, its own play. [Q, C, 24 Nov 2026]

import type { TheCameras } from '@q-mino/adapters-web'
import { TheScreens, type TheDevice, type ThePartsOfTheApp } from '@q-mino/adapters-web/screens'
import type * as boundary from '@q-mino/boundary'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { useRef } from 'preact/hooks'
import { texts } from '../texts/index.ts'
import {
  a_camera_of_test,
  a_device_of_test,
  a_node_of_test,
  a_sharing_of_test,
  type ACameraOfTest,
  type ANodeOfTest,
  type HowItAnswersTheParts,
  type WhatTheNodeHolds,
} from '../the_node_of_a_story/index.ts'
import { a_play_starts } from './the_plays.ts'

/** The story's hand on the screens while it plays. */
export interface TheStorysHand {
  readonly node: ANodeOfTest
  readonly camera: ACameraOfTest
  /** The screen shown, the last of the way. */
  readonly shown: () => HTMLElement
  /** She taps the button with these words on the screen shown (a dialog or a menu of it included). */
  readonly taps: (words: string) => void
  /** She types in the field of the screen shown, by its name. */
  readonly types: (field: string, text: string) => void
  /** Until the check holds, three seconds at most. */
  readonly until: (check: () => boolean) => Promise<void>
  /** Until the screen shown has these words. */
  readonly until_it_says: (words: string) => Promise<void>
  /** Until the app has these words, over the screen shown too (the strip). */
  readonly until_the_app_says: (words: string) => Promise<void>
}

/** What a story of a screen opens. */
export interface AScreenStorysSetting {
  /** What her node holds at the start. */
  readonly holds?: Partial<WhatTheNodeHolds>
  /** The link she opened the app with. */
  readonly a_link?: ui_value.what_it_holds
  /** The relay's public configuration (REL-8), as the composition root gives it. */
  readonly the_relay_s_public_configuration?: string
  /** The words of the extensions the app carries; the phone's by default. */
  readonly words?: Readonly<Record<string, boundary.the_words_of_an_extension>>
  /** The parts the app carries (K-3); none by default, every slot the app's fault. */
  readonly parts?: ThePartsOfTheApp
  /** How her node answers what the parts ask (K-3); greetings' greeting by default. */
  readonly answers?: HowItAnswersTheParts
  /** Whether her phone shares (Web Share); it does by default. */
  readonly shares?: boolean
  /** How many cameras her phone has; one by default. */
  readonly cameras?: TheCameras
  /** A camera of her phone that is not the story's own (off, refused, missing, busy); its `camera` is then of no use. */
  readonly scans?: TheDevice['scans']
  /** Her gestures, until the screen shows the story's case. */
  readonly plays?: (hand: TheStorysHand) => Promise<void>
}

const the_ids = Array.from({ length: 64 }, (_, at) => `G${String(at + 1)}`)

const a_while = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const until = async (check: () => boolean): Promise<void> => {
  for (let waited = 0; waited < 3000; waited += 20) {
    if (check()) return
    await a_while(20)
  }
  throw new Error('a story waited three seconds')
}

/** The screen shown of a frame, if it is drawn yet. */
const the_screen_shown = (root: HTMLElement | null): HTMLElement | null =>
  root?.querySelector<HTMLElement>('main > div:not([hidden]) > section') ?? null

const a_hand = (
  the_root: { readonly current: HTMLElement | null },
  node: ANodeOfTest,
  camera: ACameraOfTest,
): TheStorysHand => {
  const shown = (): HTMLElement => {
    const screen = the_screen_shown(the_root.current)
    if (screen === null) throw new Error('no screen shown')
    return screen
  }
  return {
    node,
    camera,
    shown,
    taps: (words) => {
      const button = [...shown().querySelectorAll('button')].find(
        (one) => one.textContent.trim() === words,
      )
      if (button === undefined) throw new Error(`no button "${words}"`)
      button.click()
    },
    types: (field, text) => {
      const input = shown().querySelector<HTMLInputElement>(`input[name="${field}"]`)
      if (input === null) throw new Error(`no field "${field}"`)
      input.value = text
      input.dispatchEvent(new Event('input', { bubbles: true }))
    },
    until,
    until_it_says: (words) =>
      until(() => (the_screen_shown(the_root.current)?.textContent ?? '').includes(words)),
    until_the_app_says: (words) =>
      until(() => (the_root.current?.textContent ?? '').includes(words)),
  }
}

export const AScreenStory = (props: AScreenStorysSetting) => {
  const the_root = useRef<HTMLDivElement>(null)
  const made = useRef<{ readonly node: ANodeOfTest; readonly camera: ACameraOfTest } | undefined>(
    undefined,
  )
  if (made.current === undefined) {
    const node = a_node_of_test(props.holds, props.answers)
    const camera = a_camera_of_test(props.cameras)
    made.current = { node, camera }
    const hand = a_hand(the_root, node, camera)
    a_play_starts(
      (async () => {
        await until(() => the_screen_shown(the_root.current) !== null)
        await props.plays?.(hand)
        // Her node read again after the last gesture, the screen drawn.
        await a_while(120)
      })().catch((fault: unknown) => {
        console.error(fault)
        if (the_root.current !== null) the_root.current.dataset['state'] = 'its_play_failed'
      }),
    )
  }
  const { node, camera } = made.current
  return (
    <div class="a-screen-story" ref={the_root}>
      <TheScreens
        node={node.node}
        device={a_device_of_test(
          the_ids,
          props.scans ?? camera.scans,
          a_sharing_of_test(props.shares ?? true),
        )}
        texts={
          props.words === undefined ? texts.screens : { ...texts.screens, extensions: props.words }
        }
        {...(props.a_link === undefined ? {} : { a_link: props.a_link })}
        {...(props.parts === undefined ? {} : { the_parts: props.parts })}
        {...(props.the_relay_s_public_configuration === undefined
          ? {}
          : { the_relay_s_public_configuration: props.the_relay_s_public_configuration })}
      />
    </div>
  )
}
