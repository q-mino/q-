import type * as zz from './library/index.ts'

// What each folder of q-'s tree sees of the others (LIB-1, DOM-25): the
// architecture's rules, as data for the generator, which writes into the
// scopes of a folder the folders it sees, with those kinds only. What is not
// listed is not seen; a folder sees its ancestors by the tree's rule. Its
// keys are the top of the tree, the kernel's domains of § 2 as they are
// written (MBX-4): since part 8.1 the relay's. A folder they do not name
// (`library/`, the domains still to write) is outside it.

export const sight = {
  /** The relay's business sees no other domain (GR-3): its mailboxes are its own. */
  mailbox: {},
  /** The relay's personas see the use cases, identities and facts of the mailbox (PER-19, GR-1). */
  desk: { mailbox: ['usecase', 'id', 'fact'] },
} as const satisfies zz.Sight
