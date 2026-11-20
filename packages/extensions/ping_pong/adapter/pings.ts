import * as zz from '@q-mino/domains/library'
import {
  a_ping_is_there,
  closed_with,
  the_ping_waits,
  what_came_back_is,
} from '../business/pings/_dsl.ts'
import type * as pings_fact from '../business/pings/_fact.ts'
import type * as pings_predicate from '../business/pings/_predicate.ts'
import { ping } from '../business/pings/_value.ts'
import type { Fragment, Seen, Write } from './partition.ts'

// The state of `pings` in its partition (EXT-14; PNG-2, PNG-3; part 14.2):
// its records under `state/`, a ping sent by its identity
// (`state/ping/<id>`), a pong given back by its own (`state/pong/<id>`);
// its predicates' fragments and its facts' writes over them, the meanings
// from the business's `dsl` (DOM-5). The three predicates over what came
// back read no key: they hold on the return's input, as the office of the
// extensions chooses its branch (EXT-8).

/** The key of a ping the node sent. */
const the_ping = (ping_id: string): string => `state/ping/${ping_id}`

/** The key of a pong the node gave back. */
const the_pong = (pong_id: string): string => `state/pong/${pong_id}`

/** The ping kept at its key, parsed as the business's record. */
const ping_in = (seen: Seen, ping_id: string): ping | undefined => {
  const found = seen(the_ping(ping_id))
  return found === undefined ? undefined : ping.parse(found)
}

/** A ping closed with what came back, at that time: the record rewritten, none if the node never sent it. */
const closing =
  (meaning: Parameters<typeof closed_with>[0]) =>
  (fact: { readonly ping_id: string; readonly at: string }): Write => ({
    reads: [the_ping(fact.ping_id)],
    writes: (seen) => {
      const before = ping_in(seen, fact.ping_id)
      return before === undefined
        ? []
        : [
            {
              write: 'set',
              key: the_ping(fact.ping_id),
              value: zz.as_json(closed_with(meaning, fact.at)(before)),
            },
          ]
    },
  })

export const pings_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof pings_predicate>,
  Fragment
> = {
  'business/pings/predicate/a_ping_has_this_id': (p) => ({
    reads: [the_ping(p.ping_id)],
    holds: (seen) => a_ping_is_there(ping_in(seen, p.ping_id)),
  }),
  'business/pings/predicate/the_ping_waits': (p) => ({
    reads: [the_ping(p.ping_id)],
    holds: (seen) => the_ping_waits(ping_in(seen, p.ping_id)),
  }),
  'business/pings/predicate/the_pong_came_back': (p) => ({
    reads: [],
    holds: () => what_came_back_is('the_pong_came_back')(p.what_came_back),
  }),
  'business/pings/predicate/the_ping_had_no_response': (p) => ({
    reads: [],
    holds: () => what_came_back_is('the_ping_had_no_response')(p.what_came_back),
  }),
  'business/pings/predicate/the_peer_cannot_answer': (p) => ({
    reads: [],
    holds: () => what_came_back_is('the_peer_cannot_answer')(p.what_came_back),
  }),
  'business/pings/predicate/a_pong_has_this_id': (p) => ({
    reads: [the_pong(p.pong_id)],
    holds: (seen) => seen(the_pong(p.pong_id)) !== undefined,
  }),
}

export const pings_writes: zz.FactWrites<zz.FactsIn<typeof pings_fact>, Write> = {
  'business/pings/fact/a_ping_has_been_sent': (fact) => ({
    reads: [],
    writes: () => [{ write: 'set', key: the_ping(fact.ping.id), value: zz.as_json(fact.ping) }],
  }),
  'business/pings/fact/a_pong_has_been_received': closing('the_pong_came_back'),
  'business/pings/fact/a_ping_has_had_no_response': closing('the_ping_had_no_response'),
  'business/pings/fact/a_ping_could_not_be_answered': closing('the_peer_cannot_answer'),
  'business/pings/fact/a_ping_has_been_answered': (fact) => ({
    reads: [],
    writes: () => [{ write: 'set', key: the_pong(fact.pong.id), value: zz.as_json(fact.pong) }],
  }),
}
