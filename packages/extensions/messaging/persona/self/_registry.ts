// generated

// The path registry of `persona/self` (DOM-24): every path with its component,
// in the order of the twins. The configurator gives it to the library, which
// reads it in reverse, from a component to its path, by object identity.

import type * as zz from '../../../../domains/src/library/index.ts'
import * as value from './_value.ts'
import * as usecase from './_usecase.ts'
import * as version from './_version.ts'

export const registry = {
  'persona/self/value/instant': value.instant,
  'persona/self/value/text': value.text,
  'persona/self/value/stage': value.stage,
  'persona/self/value/whose': value.whose,
  'persona/self/value/place': value.place,
  'persona/self/value/to_read': value.to_read,
  'persona/self/usecase/write_a_message': usecase.write_a_message,
  'persona/self/usecase/write_a_message_input': usecase.write_a_message_input,
  'persona/self/usecase/read_a_chat': usecase.read_a_chat,
  'persona/self/usecase/read_a_chat_input': usecase.read_a_chat_input,
  'persona/self/usecase/a_chat': usecase.a_chat,
  'persona/self/usecase/a_chat_input': usecase.a_chat_input,
  'persona/self/usecase/a_chat_at_a_glance': usecase.a_chat_at_a_glance,
  'persona/self/usecase/a_chat_at_a_glance_input': usecase.a_chat_at_a_glance_input,
  'persona/self/version/self': version.self,
} satisfies zz.Registry
