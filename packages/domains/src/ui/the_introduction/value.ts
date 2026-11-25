import { z } from 'zod'
import { _ui } from './_scope_value.ts'

// The introduction (UI-6; Alessandro's plan of the MVP, 24 Nov 2026): three
// cards that tell what Cumino is, turned one after the other. Read the first
// time after her first face, before the server, which she may skip; read
// again from the menu, going back where she was. Nothing keeps that she read
// it: the first time is a step of the way after her first face, as the
// server's screen is (UI-5).

/** A card of the introduction, in its order: what Cumino is (a contact is a hand shaken); how her letters travel (Cumino informs, it does not guarantee); the extensions (Cumino does little by itself, the rest she turns on). */
export const a_card = z.enum(['what_cumino_is', 'how_the_letters_travel', 'the_extensions'])

/** The screen's state: how it is read, and the card shown. */
export const the_state = z.strictObject({
  read: _ui.value.how_the_introduction_is_read,
  card: a_card,
})

/** What happens on the screen: she turns to the next card, to the card before, she skips it, she goes back. */
export const what_happens = z.discriminatedUnion('happens', [
  z.strictObject({ happens: z.literal('she_turns_to_the_next_card') }),
  z.strictObject({ happens: z.literal('she_turns_to_the_card_before') }),
  z.strictObject({ happens: z.literal('she_skips_it') }),
  _ui.value.she_goes_back,
])

/** A turn of the screen. */
export const a_turn = z.strictObject({
  state: the_state,
  asks: z.array(_ui.value.what_it_asks).max(8),
  goes: _ui.value.where_it_goes,
})

/**
 * What the screen shows: the card, the cards in their order (where she is
 * among them), where going on takes her (the next card; after the last, the
 * server the first time, back where she was again), whether there is a card
 * before to turn to, and whether she may skip the rest (the first time,
 * before the last card).
 */
export const what_it_shows = z.strictObject({
  card: a_card,
  the_cards: z.array(a_card).max(8),
  going_on: z.enum(['to_the_next_card', 'to_the_server', 'back_where_she_was']),
  turning_back: z.enum(['to_the_card_before', 'none']),
  skipping: z.enum(['to_the_server', 'none']),
})
