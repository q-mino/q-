import type * as zz from './library/index.ts'

// What each folder of q-'s tree sees of the others (LIB-1, DOM-25): the
// architecture's rules, as data for the generator, which writes into the
// scopes of a folder the folders it sees, with those kinds only. What is not
// listed is not seen; a folder sees its ancestors by the tree's rule. Its
// keys are the top of the tree, the kernel's domains of § 2 as they are
// written (MBX-4): since part 8.1 the relay's, since part 9.1 `seals`, since
// part 11.1 `bonds`, since part 11.2 `reaction` (GR-9), since part 10.1 `post`, since part 12.4 `extensions`, since part 13.1 `auth` and `persona`, since part 15.1 `user`. A folder they do not name (`library/`, the domains still
// to write) is outside it.

export const sight = {
  /** The relay's business sees no other domain (GR-3): its mailboxes are its own. */
  mailbox: {},
  /** The relay's personas see the use cases, identities and facts of the mailbox (PER-19, GR-1). */
  desk: { mailbox: ['usecase', 'id', 'fact'] },
  /** The safe sees no other domain: `seals` imports the library only (§ 2, SEA-1). */
  seals: {},
  /** The post sees the safe's identities: a request names the face that signs it (GR-5, PST-5). */
  post: { seals: ['id'] },
  /** The address book sees no other domain: `bonds` imports the library only (§ 2, BND-1). */
  bonds: {},
  /** The reactions between the kernel's domains see the facts they react to and the use cases they invoke (GR-9, DOM-16). */
  reaction: { bonds: ['usecase', 'fact'], seals: ['usecase', 'fact'] },
  /** The extensions' office sees the address book's identities: an offer is withdrawn from a bond, named by its id (GR-3, EXT-7). */
  extensions: { bonds: ['id'] },
  /** Auth sees no other domain: its data is its adapters', over the reads of `bonds` and `extensions` (GR-4, PER-9). */
  auth: {},
  /** The kernel's personas see the use cases, identities and facts of the address book and of the office of the extensions (GR-1), the lookups and identities of auth (PER-9). */
  persona: {
    bonds: ['usecase', 'id', 'fact'],
    extensions: ['usecase', 'id', 'fact'],
    auth: ['lookup', 'id'],
  },
  /**
   * The user domain sees no other domain (GR-2, GR-7, USR-1): it names faces,
   * bonds and extensions by the identities `self`'s reads give, in its own
   * words; the port toward `self` is the configurator's, typed on its contract.
   */
  user: {},
} as const satisfies zz.Sight
