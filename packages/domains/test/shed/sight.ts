import type * as wlib from './wlib.ts'

// What each folder of Shed's tree sees of the others (LIB-1, DOM-25): the
// architecture's rules, as data for the generator, which writes into the
// heres of a folder the folders it sees, with those kinds only. What is not
// listed is not seen. A folder sees its ancestors by the tree's rule, not by
// this map. Its keys are the top of the tree (DOM-25): a folder they do not
// name (`adapter/`) is outside it.

export const sight = {
  /** A business domain sees of another only its identities (GR-3, V11). */
  business: { business: ['id'] },
  /** A persona sees the use cases, identities and facts of the business (GR-1), the lookups and identities of auth (PER-9). */
  persona: { business: ['usecase', 'id', 'fact'], auth: ['lookup', 'id'] },
  /** A reaction sees the facts it reacts to and the use cases it invokes (GR-9, DOM-16). */
  reaction: { business: ['usecase', 'fact'] },
  /** Auth sees no other domain: its data is its adapters' (D43, PER-10). */
  auth: {},
} as const satisfies wlib.Sight
