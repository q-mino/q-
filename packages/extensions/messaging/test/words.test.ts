import * as boundary from '@q-mino/boundary'
import { describe, expect, expectTypeOf, test } from 'vitest'
import committed from '../texts/it.json' with { type: 'json' }
import type { manifest } from '../manifest.ts'
import type { registry } from '../persona/self/_registry.ts'
import { words } from '../texts/it.ts'

// Messaging's words (EXT-16, WEB-22, MSG-10; part M2): its texts the kernel
// draws for it, in Italian, provisional [Q, C, provisional: A to confirm],
// written in a typed module (`texts/it.ts`) whose type asks its name and a
// label for each of its slots (no action, so no words of events); and their
// data form, written by its build and committed (`texts/it.json`), which
// must not differ from the module, parsed as the kernel parses it.

/** The words messaging's module must give, by its declaration and the registry of `self`. */
type ItsWords = boundary.Words<typeof manifest, typeof registry>

/** Messaging's words with one of their parts replaced. */
type With<part extends keyof typeof words, replaced> = Omit<typeof words, part> &
  Readonly<Record<part, replaced>>

describe('the words of messaging (EXT-16)', () => {
  test('the committed texts/it.json is what the build writes: run `pnpm --filter @q-mino/messaging words`', () => {
    expect(boundary.the_words_of_an_extension.parse(committed)).toEqual(words)
  })

  test('its name, «Messaggi», and the label of its slot, «Chat»', () => {
    expect(words.name).toBe('Messaggi')
    expect(words.slots.the_chat).toBe('Chat')
  })

  test('its words are typed by its manifest: a label per slot, no action, no own event', () => {
    expectTypeOf<keyof ItsWords['slots']>().toEqualTypeOf<'the_chat'>()
    expectTypeOf(words).toExtend<ItsWords>()
  })

  test('a slot’s label missing, or a label for a point it does not declare, does not compile', () => {
    expectTypeOf<With<'slots', Record<string, never>>>().not.toExtend<ItsWords>()
    expectTypeOf<With<'actions', { write: string }>>().not.toExtend<ItsWords>()
  })
})
