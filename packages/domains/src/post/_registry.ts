// generated

// The path registry of `post` (DOM-24): every path with its component, in the
// order of the twins. The configurator gives it to the library, which reads it
// in reverse, from a component to its path, by object identity.

import type * as zz from '../library/index.ts'
import * as value from './_value.ts'

export const registry = {
  'post/value/identity': value.identity,
  'post/value/face_key': value.face_key,
  'post/value/signature': value.signature,
  'post/value/deposit_address': value.deposit_address,
  'post/value/relay_address': value.relay_address,
  'post/value/relays': value.relays,
  'post/value/mailbox': value.mailbox,
  'post/value/content': value.content,
  'post/value/some_bytes': value.some_bytes,
  'post/value/persona': value.persona,
  'post/value/invocation': value.invocation,
  'post/value/whose_request': value.whose_request,
  'post/value/letter_schema': value.letter_schema,
  'post/value/request': value.request,
  'post/value/response': value.response,
  'post/value/letter': value.letter,
  'post/value/signed_letter': value.signed_letter,
  'post/value/envelope_format': value.envelope_format,
  'post/value/envelope': value.envelope,
  'post/value/annotation_of_an_anonymous_letter': value.annotation_of_an_anonymous_letter,
  'post/value/caller': value.caller,
  'post/value/opened_envelope': value.opened_envelope,
  'post/value/sealed_letter': value.sealed_letter,
} satisfies zz.Registry
