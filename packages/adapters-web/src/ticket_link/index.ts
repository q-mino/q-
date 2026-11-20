// The ticket's link (WEB-1; BND-7, BND-10, F2): the address of the phone's
// page with a ready ticket after `#`, which a browser never sends to the
// server that serves the page; its QR draws it. The ticket travels as the
// domain gives it (`their_ticket`), its JSON in base64url, so that the link
// carries it without knowing its fields (ADP-4): a field the ticket gains in
// a minor goes with it. Read back, it is parsed with the domain's schema, as
// any data from outside.

import { their_ticket } from '@q-mino/domains/bonds/address_book/_value.ts'
import { base64url_of, bytes_of_base64url } from '../base64url/index.ts'

/** What a link's fragment begins with when it carries a ticket: the kind of what it carries. */
export const the_mark_of_a_ticket = 'ticket='

/** The link of a ticket, at the phone's page: the page's address, whatever its fragment was, with the ticket after `#`. */
export const the_link_of_a_ticket =
  (page: string) =>
  (ticket: their_ticket): string => {
    const link = new URL(page)
    link.hash =
      the_mark_of_a_ticket + base64url_of(new TextEncoder().encode(JSON.stringify(ticket)))
    return link.href
  }

/**
 * What a link carries: a ticket in its form; none (not a link, or a link
 * with no ticket); or a ticket out of its form (its text is no base64url,
 * UTF-8 or JSON, or it is not a ticket as the domain's schema says), so that
 * the screen can tell a broken link from another one.
 */
export type ALinksTicket =
  | { readonly carries: 'a_ticket'; readonly ticket: their_ticket }
  | { readonly carries: 'no_ticket' }
  | { readonly carries: 'a_ticket_out_of_its_form' }

const out_of_its_form: ALinksTicket = { carries: 'a_ticket_out_of_its_form' }

/** A text of UTF-8 bytes, or none when they are not UTF-8. */
const utf8_text_of = (bytes: Uint8Array<ArrayBuffer>): string | undefined => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return undefined
  }
}

/** The value a JSON text tells, or none when it is no JSON. */
const json_of = (text: string): { readonly value: unknown } | undefined => {
  try {
    return { value: JSON.parse(text) }
  } catch {
    return undefined
  }
}

/**
 * The ticket a link carries, whatever page it points to: the link of
 * another copy of the phone's page carries a ticket as well (the code is
 * free), and who wrote it is a claim (F2).
 */
export const the_ticket_in_a_link = (text: string): ALinksTicket => {
  if (!URL.canParse(text)) return { carries: 'no_ticket' }
  const fragment = new URL(text).hash.slice(1)
  if (!fragment.startsWith(the_mark_of_a_ticket)) return { carries: 'no_ticket' }
  const bytes = bytes_of_base64url(fragment.slice(the_mark_of_a_ticket.length))
  const json = bytes === undefined ? undefined : utf8_text_of(bytes)
  const told = json === undefined ? undefined : json_of(json)
  if (told === undefined) return out_of_its_form
  const parsed = their_ticket.safeParse(told.value)
  return parsed.success ? { carries: 'a_ticket', ticket: parsed.data } : out_of_its_form
}
