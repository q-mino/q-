import { useSignal } from '@preact/signals'
import type * as boundary from '@q-mino/boundary'
import { the_words_of_the_part as words } from '../texts/the_part.it.ts'

// Greetings' part (EXT-16, K-3; part M4 of messaging): the test
// extension's slot, on a bond's screen and on its row in her contacts, the
// first part of an extension's package the kernel draws (GR-10: its
// `parts/` imports Preact and its signals, `boundary`'s types, its own
// words). In its place, a line; on the whole screen, «Saluta», which
// invokes its leaf `greet_a_bond` on `self` through its door, and how it
// went. A part acting at her tap here; the kernel cannot tell it from one
// acting by itself (EXT-16), and shows it as greetings' activity.

/**
 * Its look (K-3): a part draws its own `<style>`, in the layer of the
 * extensions, scoped by its class, with the design's variables, so that it
 * follows the theme (Roano, Lavagna) and the kernel's mark stays over it
 * (the layer `frame`, WEB-26). [Q, C, high impact: A to discuss]
 */
const its_look = `@layer extensions {
  .the-greetings { display: grid; gap: var(--space-2); justify-items: start; margin: 0; }
  .the-greetings button {
    min-block-size: var(--tap);
    padding: var(--space-2) var(--space-4);
    border: 2px solid var(--extension-edge);
    border-radius: var(--radius-round);
    background: var(--extension-raised);
    color: var(--extension-ink);
    font: inherit;
    font-weight: var(--weight-strong);
  }
  .the-greetings button:disabled { opacity: 0.6; }
  .the-greetings [role='status'] { margin: 0; color: var(--ink-soft); }
}`

/** How the greeting asked from here went: nothing yet, on its way, sent (its leaf's event), or not sent (another event, or the kernel did not serve it). */
type how_it_went = keyof typeof words.how_it_went

/** The bond the part is told, on a bond's screen or on its row; none on the extension's own. */
const the_bond_of = (placed: boundary.WhatAPartIsGiven['placed']): string | undefined =>
  placed.place === 'the_extension' ? undefined : placed.data.bond

/** Its leaf asked through the door, and how it went by what it was told: sent on `the_greeting_is_sent`, else not sent. */
const greets = async (door: boundary.APartsDoor, bond: string): Promise<how_it_went> => {
  for await (const told of door.invoke({
    use_case: 'usecase/greet_a_bond',
    version: '1.0.0',
    input: { bond },
  })) {
    if (told.told === 'an_event' && told.event.event === 'the_greeting_is_sent') return 'sent'
  }
  return 'not_sent'
}

export const part = (given: boundary.WhatAPartIsGiven) => {
  const went = useSignal<how_it_went>('nothing_yet')
  const bond = the_bond_of(given.placed)
  if (given.where === 'in_its_place')
    return (
      <>
        <style>{its_look}</style>
        <p class="the-greetings" data-state={went.value}>
          {went.value === 'nothing_yet' ? words.in_its_place : words.how_it_went[went.value]}
        </p>
      </>
    )
  return (
    <div class="the-greetings" data-state={went.value}>
      <style>{its_look}</style>
      <button
        type="button"
        disabled={bond === undefined || went.value === 'on_its_way'}
        onClick={() => {
          if (bond === undefined) return
          went.value = 'on_its_way'
          void greets(given.door, bond).then((how) => {
            went.value = how
          })
        }}
      >
        {words.greet}
      </button>
      <p role="status">{words.how_it_went[went.value]}</p>
    </div>
  )
}
