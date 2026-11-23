import { z } from 'zod'
import { calculation, value } from './_scope_calculation.ts'

// The calculations over a face, the subject of this file (DOM-18, SC-21):
// what the safe computes with a face's private key, which never leaves it
// (SEA-6). Their value is the adapters', over the primitives port
// (`dsl.the_signature_of`, `dsl.opened_with`).

/** The face's signature over a content. */
export const the_signature_of_a_content = calculation({
  subject: 'face',
  parameters: z.strictObject({
    content: value.content,
  }),
  value: value.signature,
})

/** A sealed content opened with the face's private key, or not. */
export const the_sealed_content_opened = calculation({
  subject: 'face',
  parameters: z.strictObject({
    sealed_content: value.sealed_content,
  }),
  value: value.opening,
})
