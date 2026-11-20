// generated

// The calculations of `seals/safe` from `face_calculation.ts` (DOM-25): the
// same objects under the same names, branded with their path (DOM-24), each
// schema with its output type under the same name, so that one import gives
// both. Only this module imports `face_calculation.ts`.

import { z } from 'zod'
import * as calculation from './face_calculation.ts'

/**
 * The face's signature over a content.
 *
 * @see {@link calculation.the_signature_of_a_content}
 */
export const the_signature_of_a_content =
  calculation.the_signature_of_a_content.brand<'seals/safe/calculation/face/the_signature_of_a_content'>()
export type the_signature_of_a_content = z.output<typeof the_signature_of_a_content>

/**
 * A sealed content opened with the face's private key, or not.
 *
 * @see {@link calculation.the_sealed_content_opened}
 */
export const the_sealed_content_opened =
  calculation.the_sealed_content_opened.brand<'seals/safe/calculation/face/the_sealed_content_opened'>()
export type the_sealed_content_opened = z.output<typeof the_sealed_content_opened>
