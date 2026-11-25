// Slot (EXT-16, WEB-30): where a part of an extension's sits at a place of
// the kernel's screens, told the place (`place`) and what it speaks of, its
// subject (`subject`: on a bond, the contact), which it hands to the part.
// In its place, a head with its label and the gesture that takes it to the
// whole screen; on the whole screen (Alessandro, 24 Nov 2026), the same
// part with the same subject, the corner telling who has the screen (the
// chain of the marks around it) and the gesture that gives it back. The
// part is never drawn again: the slot itself goes to the top layer (a
// popover), so what the part holds stays as it was. Escape and Android's
// back give the screen back, as the browser closes a popover. A slot is a
// grid of named areas, `head` (or `corner`) and `part`, its columns a
// subgrid of its mark's, so that what it holds lines up with the rows of
// the screen; slots nest, a mark inside a slot's part holding slots of its
// own. Whether it is on the whole screen is a state of the look, not of
// `ui` (the MVP's plan, § 6): nothing she can do or read changes.
// [Q, C, 24 Nov 2026]

import { createContext, type ComponentChildren } from 'preact'
import { useSignal } from '@preact/signals'
import { useContext, useEffect, useRef } from 'preact/hooks'
import { Corner } from './corner.tsx'
import { Gesture } from './gesture.tsx'
import { TheMarksAround } from './mark.tsx'

/**
 * Whether a slot on the whole screen takes the page's: it does in the app;
 * in the gallery, where many stories share a page, only a story shown
 * alone (WEB-28), so that one opened covers its own frame, not the gallery.
 */
export const SlotsTakeTheScreen = createContext(true)

/** Where a slot is: in its place, or on the whole screen. */
export type WhereASlotIs = 'in_its_place' | 'on_the_whole_screen'

/** The kernel's words around a slot. */
export interface TheWordsOfASlot {
  /** The gesture that takes it to the whole screen. */
  readonly takes_the_screen: string
  /** The gesture that gives the screen back. */
  readonly gives_it_back: string
  /** What the corner is, to a screen reader. */
  readonly who_has_the_screen: string
}

/**
 * A slot to the top layer, after the slot around it on the whole screen if
 * there is one (a story opens both at once: the inner one first, it would
 * close as the outer one opens, a popover not inside the last one shown).
 */
const on_the_top_layer = (slot: HTMLElement): void => {
  const around = slot.parentElement?.closest<HTMLElement>('.slot[data-state="on_the_whole_screen"]')
  if (around !== null && around !== undefined && !around.matches(':popover-open')) {
    around.addEventListener(
      'toggle',
      () => {
        if (slot.isConnected && slot.dataset['state'] === 'on_the_whole_screen')
          on_the_top_layer(slot)
      },
      { once: true },
    )
    return
  }
  slot.showPopover()
}

export const Slot = <Subject,>(props: {
  /** The place of the kernel's screens it sits in (`a_bond`, `the_extension`). */
  place: string
  /** What it speaks of, handed to its part: the place's data. */
  subject: Subject
  /** Its label, in its extension's words. */
  label: string
  words: TheWordsOfASlot
  /** Where it is when first drawn (a story's case); in its place, else. */
  at_first?: WhereASlotIs
  /** Its part, told its subject. */
  children: (subject: Subject) => ComponentChildren
}) => {
  const at = useSignal<WhereASlotIs>(props.at_first ?? 'in_its_place')
  const moves = (to: WhereASlotIs): void => {
    at.value = to
  }
  const where = at.value
  const the_slot = useRef<HTMLDivElement>(null)
  const takes = useContext(SlotsTakeTheScreen)
  const around = useContext(TheMarksAround)
  const popover = takes ? 'auto' : undefined
  // The browser gives the screen back (Escape, Android's back): the slot is in its place again.
  useEffect(() => {
    const slot = the_slot.current
    if (slot === null || popover === undefined || !('showPopover' in slot)) return
    const toggled = (event: Event): void => {
      if (event instanceof ToggleEvent && event.newState === 'closed' && slot.isConnected)
        moves('in_its_place')
    }
    slot.addEventListener('toggle', toggled)
    return () => {
      slot.removeEventListener('toggle', toggled)
    }
  }, [])
  // The top layer follows where it is; after a move of hers, the focus goes to the gesture that moves it back.
  const shown = useRef<boolean | undefined>(undefined)
  useEffect(() => {
    const slot = the_slot.current
    if (slot === null) return
    const whole = where === 'on_the_whole_screen'
    if (whole === shown.current) return
    if (popover !== undefined && 'showPopover' in slot) {
      if (whole) on_the_top_layer(slot)
      else if (shown.current === true) slot.hidePopover()
    }
    if (shown.current !== undefined)
      slot.querySelector<HTMLElement>(':scope > [data-part] .gesture')?.focus()
    shown.current = whole
  }, [where])
  const whole = where === 'on_the_whole_screen'
  return (
    <div
      class="slot"
      role="region"
      aria-label={props.label}
      data-place={props.place}
      data-state={where}
      popover={popover}
      ref={the_slot}
    >
      {whole ? (
        <div data-part="corner">
          <Corner label={props.words.who_has_the_screen} chain={around}>
            <Gesture
              kind="quiet"
              label={props.words.gives_it_back}
              glyph="minimize_2"
              does={{
                does: 'taps',
                taps: () => {
                  moves('in_its_place')
                },
              }}
            />
          </Corner>
        </div>
      ) : (
        <div data-part="head">
          <span data-part="label">{props.label}</span>
          <Gesture
            kind="quiet"
            label={props.words.takes_the_screen}
            glyph="maximize_2"
            does={{
              does: 'taps',
              taps: () => {
                moves('on_the_whole_screen')
              },
            }}
          />
        </div>
      )}
      <div data-part="part">{props.children(props.subject)}</div>
    </div>
  )
}
