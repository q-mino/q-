import * as boundary from '@q-mino/boundary'
import { describe, expect, expectTypeOf, test } from 'vitest'
import committed from '../texts/it.json' with { type: 'json' }
import type { manifest } from '../manifest.ts'
import type { registry } from '../persona/self/_registry.ts'
import { words } from '../texts/it.ts'

// Ping pong's words (EXT-16, WEB-22; part 22.2, A, 22 Nov 2026): its texts
// the kernel draws in its mark, in Italian (provisional, A to confirm: words
// she reads), written in a typed module (`texts/it.ts`) whose type asks its
// name, a label for each of its actions, slots and pages, and words for
// each own event of the leaves its actions invoke on `self`; and their data
// form, written by its build and committed (`texts/it.json`), which must
// not differ from the module, parsed as the kernel parses it.

/** The words ping pong's module must give, by its declaration and the registry of `self`. */
type ItsWords = boundary.Words<typeof manifest, typeof registry>

/** Ping pong's words with one of their parts replaced. */
type With<part extends keyof typeof words, replaced> = Omit<typeof words, part> &
  Readonly<Record<part, replaced>>

describe('the words of ping pong (EXT-16)', () => {
  test('the committed texts/it.json is what the build writes: run `pnpm --filter @q-mino/ping_pong words`', () => {
    expect(boundary.the_words_of_an_extension.parse(committed)).toEqual(words)
  })

  test('its name, and the label of its action: "Ping pong", "Ping"', () => {
    expect(words.name).toBe('Ping pong')
    expect(words.actions.ping).toBe('Ping')
  })

  test('its words are typed by its manifest: a label per action, words per own event of send_a_ping, none for the kernel’s', () => {
    expectTypeOf<keyof ItsWords['actions']>().toEqualTypeOf<'ping'>()
    expectTypeOf<keyof ItsWords['events']>().toEqualTypeOf<
      | 'the_ping_is_sent'
      | 'the_ping_cannot_be_sent'
      | 'pong'
      | 'no_response'
      | 'the_peer_cannot_answer'
      | 'called_off'
    >()
    expectTypeOf(words).toExtend<ItsWords>()
  })

  test('a word missing, or a label for a point it does not declare, does not compile', () => {
    expectTypeOf<With<'events', Omit<typeof words.events, 'pong'>>>().not.toExtend<ItsWords>()
    expectTypeOf<With<'actions', Record<string, never>>>().not.toExtend<ItsWords>()
    expectTypeOf<With<'slots', { the_pings_of_a_bond: string }>>().not.toExtend<ItsWords>()
  })
})
