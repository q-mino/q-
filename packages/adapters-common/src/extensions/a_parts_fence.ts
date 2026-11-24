import * as boundary from '@q-mino/boundary'
import { as_traced, type TheKernelsTraced } from './the_kernels_trace.ts'

// A part's fence (EXT-4 "A part's fence", EXT-16; part 12.4): what the
// kernel serves of a part's messages (a slot or a page of an extension's,
// drawn in the kernel's mark), a pure function the parts are wired through.
// A part is a client of its own extension's surface on `self` only: its
// messages name no extension, and the kernel adds the name itself, so that
// it cannot name another's leaf, by construction; served only while its
// extension is active and the part is shown (placed in a screen the user
// has open); anything else refused, in the kernel's trace. Its invocations
// are the extension's activities, never the user's gestures (EXT-16): the
// kernel shows them in its mark.

/** A part, as the kernel placed it: whose it is, and whether it is shown now. */
export interface APart {
  readonly extension: string
  readonly shown: boolean
}

/**
 * What the fence did with a part's message, an ADT: served, an invocation
 * or a read it follows of its own extension's leaf on `self`, with the name
 * the kernel adds (EXT-5), its id, the version it speaks and its input; or
 * refused, with the entry of the kernel's trace.
 */
export type Fenced =
  | {
      readonly fenced: 'served'
      readonly exchange: 'invoke' | 'follow'
      readonly id: string
      readonly invokes: {
        readonly of: 'an_extension'
        readonly extension: string
        readonly persona: 'self'
        readonly use_case: string
        readonly version: string
      }
      readonly input: boundary.Json
    }
  | { readonly fenced: 'refused'; readonly traced: TheKernelsTraced }

/**
 * A part's message through the fence (EXT-4): one that is no message of a
 * part's, a part of an extension not active, or a part not shown,
 * refused and traced (`a_part_fenced`); else served, on its own
 * extension's surface on `self`, whose gate and leaf the library's mounted
 * port checks as for any invocation (`not_a_leaf`, PER-5).
 */
export const through_a_parts_fence = (given: {
  readonly part: APart
  readonly active: boolean
  readonly message: unknown
  readonly now: string
}): Fenced => {
  const refused = (
    fence: 'the_extension_is_not_active' | 'the_part_is_not_shown' | 'not_a_parts_message',
  ): Fenced => ({
    fenced: 'refused',
    traced: {
      why: 'a_part_fenced',
      extension: given.part.extension,
      now: given.now,
      fence,
      message: as_traced(given.message),
    },
  })
  const parsed = boundary.a_message_from_a_part.safeParse(given.message)
  if (!parsed.success) return refused('not_a_parts_message')
  if (!given.active) return refused('the_extension_is_not_active')
  if (!given.part.shown) return refused('the_part_is_not_shown')
  const message = parsed.data
  return {
    fenced: 'served',
    exchange: message.message,
    id: message.id,
    invokes: {
      of: 'an_extension',
      extension: given.part.extension,
      persona: 'self',
      use_case: message.use_case,
      version: message.version,
    },
    input: message.input,
  }
}
