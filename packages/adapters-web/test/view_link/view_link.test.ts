import fc from 'fast-check'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import { describe, expect, test } from 'vitest'
import {
  the_fragment_of_a_view,
  the_link_of_a_ticket,
  the_ticket_in_a_link,
  the_view_in_a_fragment,
  the_view_in_a_link,
  the_way_to_a_view,
  type TheViewsWords,
} from '../../src/index.ts'
import { lucas_ticket, the_page } from '../fixtures.ts'

// A view's link (WEB-25): the view she is on after `#/`, in her language's
// words; read back, the screen it opens, an invitation named only, or no
// view; never a ticket, and a ticket never a view. The words here are of
// test: the phone's Italian ones are proved with its screens.

const words: TheViewsWords = {
  my_contacts: 'contacts',
  the_handshake_in_person: 'in-person',
  the_handshake_at_a_distance: 'at-a-distance',
  an_invitation: 'invitation',
  the_extensions: 'extensions',
  what_happened: 'what-happened',
  the_server: 'server',
  the_introduction: 'introduction',
}
const fragment_of = the_fragment_of_a_view(words)
const view_in = the_view_in_a_fragment(words)

/** A bond as the screens show it: any text of its schema, slashes and spaces too. */
const a_bond = fc.oneof(
  fc.constantFrom('L_b', 'L/b ü', '%41', '..', '#', '?'),
  fc.string({ unit: 'grapheme', minLength: 1, maxLength: 40 }),
)

/** An extension's name, or one of its own, in snake_case (EXT-3). */
const a_name = fc.oneof(
  fc.constantFrom('ping_pong', 'the_scores'),
  fc.stringMatching(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/).filter((name) => name.length <= 64),
)

const a_view: fc.Arbitrary<ui_value.a_screen> = fc.oneof(
  fc.constantFrom<ui_value.a_screen>(
    { screen: 'my_contacts' },
    { screen: 'the_handshake_in_person' },
    { screen: 'the_handshake_at_a_distance' },
    { screen: 'the_extensions' },
    { screen: 'what_happened' },
    { screen: 'the_server' },
    { screen: 'the_introduction', read: 'again' },
  ),
  a_bond.map((bond): ui_value.a_screen => ({ screen: 'a_contact', bond })),
  a_name.map((extension): ui_value.a_screen => ({ screen: 'an_extension', extension })),
  fc.tuple(a_bond, a_name, a_name).map(([bond, extension, page]): ui_value.a_screen => ({
    screen: 'a_page',
    extension,
    page,
    told: { place: 'a_bond', bond },
  })),
  fc.tuple(a_name, a_name).map(([extension, page]): ui_value.a_screen => ({
    screen: 'a_page',
    extension,
    page,
    told: { place: 'the_extension', extension },
  })),
)

describe("a view's link", () => {
  test('gives back the view it holds, whatever its ids', () => {
    fc.assert(
      fc.property(a_view, (screen) => {
        const fragment = fragment_of(screen)
        expect(fragment).toBeDefined()
        expect(view_in(fragment ?? '')).toEqual({ holds: 'a_view', screen })
        // As the browser keeps it in its address.
        const link = new URL(the_page)
        link.hash = fragment ?? ''
        expect(link.hash).toBe(fragment)
        expect(the_view_in_a_link(words)(link.href)).toEqual({ holds: 'a_view', screen })
      }),
    )
  })

  test('is written in the words of her language, its ids after them', () => {
    expect(fragment_of({ screen: 'my_contacts' })).toBe('#/contacts')
    expect(fragment_of({ screen: 'a_contact', bond: 'L_b' })).toBe('#/contacts/L_b')
    expect(fragment_of({ screen: 'an_extension', extension: 'ping_pong' })).toBe(
      '#/extensions/ping_pong',
    )
    expect(
      fragment_of({
        screen: 'a_page',
        extension: 'ping_pong',
        page: 'the_scores',
        told: { place: 'a_bond', bond: 'L_b' },
      }),
    ).toBe('#/contacts/L_b/ping_pong/the_scores')
    expect(
      fragment_of({
        screen: 'a_page',
        extension: 'ping_pong',
        page: 'the_scores',
        told: { place: 'the_extension', extension: 'ping_pong' },
      }),
    ).toBe('#/extensions/ping_pong/the_scores')
    expect(fragment_of({ screen: 'a_contact', bond: 'L/b ü' })).toBe('#/contacts/L%2Fb%20%C3%BC')
  })

  test('has none for the first face, a state of the app; names an invitation without its ticket', () => {
    expect(fragment_of({ screen: 'the_first_face' })).toBeUndefined()
    const invitation = fragment_of({
      screen: 'an_invitation',
      link: { holds: 'a_ticket', ticket: lucas_ticket },
    })
    expect(invitation).toBe('#/invitation')
    expect(view_in(invitation ?? '')).toEqual({ holds: 'an_invitation' })
  })

  test('names the introduction the same for both readings, read back as read again, from the home (UI-6)', () => {
    for (const read of ['the_first_time', 'again'] as const)
      expect(fragment_of({ screen: 'the_introduction', read })).toBe('#/introduction')
    const again: ui_value.a_screen = { screen: 'the_introduction', read: 'again' }
    expect(view_in('#/introduction')).toEqual({ holds: 'a_view', screen: again })
    expect(the_way_to_a_view(again)).toEqual([{ screen: 'my_contacts' }, again])
  })

  test('is never a ticket, and a ticket is never a view', () => {
    const ticket = the_link_of_a_ticket(the_page)(lucas_ticket)
    expect(the_view_in_a_link(words)(ticket)).toEqual({ holds: 'no_view' })
    fc.assert(
      fc.property(a_view, (screen) => {
        expect(the_ticket_in_a_link(`${the_page}${fragment_of(screen) ?? ''}`)).toEqual({
          carries: 'no_ticket',
        })
      }),
    )
  })

  test('holds no view with no fragment, no mark, or words that name none', () => {
    for (const fragment of [
      '',
      '#',
      '#/',
      '#contacts',
      '#ticket=e30',
      '#/nowhere',
      '#/contacts/L_b/ping_pong',
      '#/contacts/L_b/ping_pong/the_scores/more',
      '#/extensions/ping_pong/the_scores/more',
      '#/server/again',
      '#/invitation/e30',
      '#/contacts/%E0%A4%A',
    ])
      expect(view_in(fragment)).toEqual({ holds: 'no_view' })
    expect(the_view_in_a_link(words)('not a link')).toEqual({ holds: 'no_view' })
    expect(the_view_in_a_link(words)(the_page)).toEqual({ holds: 'no_view' })
  })

  test('reads a slash at its end as none', () => {
    expect(view_in('#/contacts/')).toEqual({ holds: 'a_view', screen: { screen: 'my_contacts' } })
  })

  test('is reached from the home, as she would have come', () => {
    const home: ui_value.a_screen = { screen: 'my_contacts' }
    expect(the_way_to_a_view(home)).toEqual([home])
    expect(the_way_to_a_view({ screen: 'a_contact', bond: 'L_b' })).toEqual([
      home,
      { screen: 'a_contact', bond: 'L_b' },
    ])
    expect(the_way_to_a_view({ screen: 'an_extension', extension: 'ping_pong' })).toEqual([
      home,
      { screen: 'the_extensions' },
      { screen: 'an_extension', extension: 'ping_pong' },
    ])
    const on_a_bond: ui_value.a_screen = {
      screen: 'a_page',
      extension: 'ping_pong',
      page: 'the_scores',
      told: { place: 'a_bond', bond: 'L_b' },
    }
    expect(the_way_to_a_view(on_a_bond)).toEqual([
      home,
      { screen: 'a_contact', bond: 'L_b' },
      on_a_bond,
    ])
    const on_its_screen: ui_value.a_screen = {
      screen: 'a_page',
      extension: 'ping_pong',
      page: 'the_scores',
      told: { place: 'the_extension', extension: 'ping_pong' },
    }
    expect(the_way_to_a_view(on_its_screen)).toEqual([
      home,
      { screen: 'the_extensions' },
      { screen: 'an_extension', extension: 'ping_pong' },
      on_its_screen,
    ])
    expect(the_way_to_a_view({ screen: 'the_server' })).toEqual([home, { screen: 'the_server' }])
  })
})
