// generated

// The effects of `extensions/activations` from `effect.ts` (DOM-25): the same
// objects under the same names, branded with their path (DOM-24), each schema
// with its output type under the same name, so that one import gives both. Only
// this module imports `effect.ts`.

import { z } from 'zod'
import * as effect from './effect.ts'

/**
 * Ask a bond for the extensions in common (EXT-8, F7): a request to the
 * kernel's read leaf `the_extensions_in_common` on the peer's `known`
 * (`{ of: 'the_kernel', … }`), with what the node offers the bond; its
 * delivery the kernel's, over its port of requests (step 13), which maps
 * what the peer answers onto the office's closed set, the input of its
 * return, `learn_the_extensions_in_common`. Its key is the question. Its
 * deliveries are in flight together, none waiting for another's response
 * (F7, SC-56): a dead letter holds none behind it.
 *
 * @see {@link effect.ask_for_the_extensions_in_common}
 */
export const ask_for_the_extensions_in_common =
  effect.ask_for_the_extensions_in_common.brand<'extensions/activations/effect/ask_for_the_extensions_in_common'>()
export type ask_for_the_extensions_in_common = z.output<typeof ask_for_the_extensions_in_common>
