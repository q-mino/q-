// generated

// The path registry of `business/greetings` (DOM-24): every path with its
// component, in the order of the twins. The configurator gives it to the
// library, which reads it in reverse, from a component to its path, by object
// identity.

import type * as zz from '../../../../domains/src/library/index.ts'
import * as id from './_id.ts'
import * as value from './_value.ts'
import * as fact from './_fact.ts'
import * as predicate from './_predicate.ts'
import * as effect from './_effect.ts'
import * as command from './_command.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'business/greetings/id/bond': id.bond,
  'business/greetings/id/greeting_id': id.greeting_id,
  'business/greetings/id/greeting_back_id': id.greeting_back_id,
  'business/greetings/value/words': value.words,
  'business/greetings/value/waiting_time': value.waiting_time,
  'business/greetings/value/outcome': value.outcome,
  'business/greetings/value/progress': value.progress,
  'business/greetings/value/greeting': value.greeting,
  'business/greetings/value/greeting_back': value.greeting_back,
  'business/greetings/fact/a_bond_has_been_greeted': fact.a_bond_has_been_greeted,
  'business/greetings/fact/a_greeting_has_been_closed': fact.a_greeting_has_been_closed,
  'business/greetings/fact/a_bond_has_been_greeted_back': fact.a_bond_has_been_greeted_back,
  'business/greetings/predicate/a_greeting_has_this_id': predicate.a_greeting_has_this_id,
  'business/greetings/predicate/the_greeting_waits': predicate.the_greeting_waits,
  'business/greetings/predicate/a_greeting_back_has_this_id': predicate.a_greeting_back_has_this_id,
  'business/greetings/effect/ask_for_a_greeting_back': effect.ask_for_a_greeting_back,
  'business/greetings/command/the_greeting_is_new': command.the_greeting_is_new,
  'business/greetings/command/greet_a_bond': command.greet_a_bond,
  'business/greetings/command/greet_a_bond_input': command.greet_a_bond_input,
  'business/greetings/command/close_a_greeting': command.close_a_greeting,
  'business/greetings/command/close_a_greeting_input': command.close_a_greeting_input,
  'business/greetings/command/the_greeting_back_is_new': command.the_greeting_back_is_new,
  'business/greetings/command/greet_a_bond_back': command.greet_a_bond_back,
  'business/greetings/command/greet_a_bond_back_input': command.greet_a_bond_back_input,
  'business/greetings/usecase/greet_a_bond': usecase.greet_a_bond,
  'business/greetings/usecase/close_a_greeting': usecase.close_a_greeting,
  'business/greetings/usecase/greet_a_bond_back': usecase.greet_a_bond_back,
  'business/greetings/version/greetings': version.greetings,
} satisfies zz.Registry
