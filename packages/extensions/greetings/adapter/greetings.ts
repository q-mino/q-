import * as zz from '@q-mino/domains/library'
import { a_greeting_is_there, closed_with, the_greeting_waits } from '../business/greetings/_dsl.ts'
import type * as greetings_fact from '../business/greetings/_fact.ts'
import type * as greetings_predicate from '../business/greetings/_predicate.ts'
import { greeting } from '../business/greetings/_value.ts'
import type { Fragment, Seen, Write } from './partition.ts'

// The state of `greetings` in its partition (EXT-14): its records under
// `state/`, a greeting sent by its identity (`state/greeting/<id>`), a
// greeting back by its own (`state/greeting_back/<id>`); its predicates'
// fragments and its facts' writes over them, the meanings from the
// business's `dsl` (DOM-5).

/** The key of a greeting the node sent. */
const the_greeting = (greeting_id: string): string => `state/greeting/${greeting_id}`

/** The key of a greeting back the node sent. */
const the_greeting_back = (greeting_back_id: string): string =>
  `state/greeting_back/${greeting_back_id}`

/** The greeting kept at its key, parsed as the business's record. */
const greeting_in = (seen: Seen, greeting_id: string): greeting | undefined => {
  const found = seen(the_greeting(greeting_id))
  return found === undefined ? undefined : greeting.parse(found)
}

export const greetings_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof greetings_predicate>,
  Fragment
> = {
  'business/greetings/predicate/a_greeting_has_this_id': (p) => ({
    reads: [the_greeting(p.greeting_id)],
    holds: (seen) => a_greeting_is_there(greeting_in(seen, p.greeting_id)),
  }),
  'business/greetings/predicate/the_greeting_waits': (p) => ({
    reads: [the_greeting(p.greeting_id)],
    holds: (seen) => the_greeting_waits(greeting_in(seen, p.greeting_id)),
  }),
  'business/greetings/predicate/a_greeting_back_has_this_id': (p) => ({
    reads: [the_greeting_back(p.greeting_back_id)],
    holds: (seen) => seen(the_greeting_back(p.greeting_back_id)) !== undefined,
  }),
}

export const greetings_writes: zz.FactWrites<zz.FactsIn<typeof greetings_fact>, Write> = {
  'business/greetings/fact/a_bond_has_been_greeted': (fact) => ({
    reads: [],
    writes: () => [
      { write: 'set', key: the_greeting(fact.greeting.id), value: zz.as_json(fact.greeting) },
    ],
  }),
  'business/greetings/fact/a_greeting_has_been_closed': (fact) => ({
    reads: [the_greeting(fact.greeting_id)],
    writes: (seen) => {
      const before = greeting_in(seen, fact.greeting_id)
      return before === undefined
        ? []
        : [
            {
              write: 'set',
              key: the_greeting(fact.greeting_id),
              value: zz.as_json(closed_with(fact.outcome)(before)),
            },
          ]
    },
  }),
  'business/greetings/fact/a_bond_has_been_greeted_back': (fact) => ({
    reads: [],
    writes: () => [
      {
        write: 'set',
        key: the_greeting_back(fact.greeting_back.id),
        value: zz.as_json(fact.greeting_back),
      },
    ],
  }),
}
