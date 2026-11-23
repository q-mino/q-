import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import {
  the_link_of_a_ticket,
  the_mark_of_a_ticket,
  the_ticket_in_a_link,
} from '../../src/index.ts'
import { base64url_of } from '../../src/base64url/index.ts'
import { a_ticket, lucas_ticket, the_page } from '../fixtures.ts'

// The ticket's link (WEB-1): the phone's page with the ticket after `#`, the
// ticket's JSON in base64url; read back, the ticket in its form, none, or a
// ticket out of its form.

const link_of = the_link_of_a_ticket(the_page)

/** A link whose fragment carries these bytes after the mark. */
const a_link_carrying = (bytes: Uint8Array) =>
  `${the_page}#${the_mark_of_a_ticket}${base64url_of(bytes)}`
const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value))

describe("the ticket's link", () => {
  test('gives back the ticket it carries, whatever its name', () => {
    fc.assert(
      fc.property(a_ticket, (ticket) => {
        expect(the_ticket_in_a_link(link_of(ticket))).toEqual({ carries: 'a_ticket', ticket })
      }),
    )
  })

  test("is the page's address, the ticket after `#`: nothing of it in what goes to the server", () => {
    const link = new URL(link_of(lucas_ticket))
    expect(link.origin + link.pathname).toBe(the_page)
    expect(link.search).toBe('')
    expect(link.hash.startsWith(`#${the_mark_of_a_ticket}`)).toBe(true)
    expect(link.hash).toMatch(/^#ticket=[A-Za-z0-9_-]+$/)
  })

  test('is written as a browser keeps it: nothing in it to escape', () => {
    fc.assert(
      fc.property(a_ticket, (ticket) => {
        const link = link_of(ticket)
        expect(new URL(link).href).toBe(link)
      }),
    )
  })

  test("replaces the page's fragment, and keeps its path", () => {
    const link = the_link_of_a_ticket('https://q.example.org/cumino/?lang=it#bonds')(lucas_ticket)
    expect(link.startsWith('https://q.example.org/cumino/?lang=it#ticket=')).toBe(true)
    expect(the_ticket_in_a_link(link)).toEqual({ carries: 'a_ticket', ticket: lucas_ticket })
  })

  test('carries a ticket from another copy of the page: who wrote the link is a claim (F2)', () => {
    const elsewhere = the_link_of_a_ticket('https://another.example/q/')(lucas_ticket)
    expect(the_ticket_in_a_link(elsewhere)).toEqual({ carries: 'a_ticket', ticket: lucas_ticket })
  })

  test('carries no ticket when it is no link, or has no ticket after `#`', () => {
    for (const text of [
      '',
      'Luca',
      'cumino.example/#ticket=e30',
      the_page,
      `${the_page}#`,
      `${the_page}#bonds`,
      `${the_page}?ticket=e30`,
      `${the_page}#tickets=e30`,
      'WIFI:S:home;T:WPA;P:secret;;',
    ]) {
      expect(the_ticket_in_a_link(text)).toEqual({ carries: 'no_ticket' })
    }
  })

  test('carries a ticket out of its form when its text is no base64url, UTF-8 or JSON, or no ticket', () => {
    const without_secret = {
      key: lucas_ticket.key,
      introduced_as: lucas_ticket.introduced_as,
      mailbox: lucas_ticket.mailbox,
    }
    for (const link of [
      `${the_page}#ticket=`,
      `${the_page}#ticket=Zm9v=`,
      `${the_page}#ticket=Z`,
      `${the_page}#ticket=%7B%7D`,
      a_link_carrying(Uint8Array.of(0xff, 0xfe, 0x7b, 0x7d)),
      a_link_carrying(new TextEncoder().encode('not json')),
      a_link_carrying(json({})),
      a_link_carrying(json([lucas_ticket])),
      a_link_carrying(json(without_secret)),
      a_link_carrying(json({ ...lucas_ticket, expires_at: '2026-11-22T09:00:00.000Z' })),
      a_link_carrying(
        json({
          ...lucas_ticket,
          mailbox: { ...lucas_ticket.mailbox, relays: ['http://relay.example'] },
        }),
      ),
      a_link_carrying(json({ ...lucas_ticket, introduced_as: '' })),
    ]) {
      expect(the_ticket_in_a_link(link)).toEqual({ carries: 'a_ticket_out_of_its_form' })
    }
  })
})
