import type * as zz from '../../domains/src/library/index.ts'

// What each folder of messaging's tree sees of the others (DOM-25, EXT-11,
// MSG-1; part M2), on ping pong's model. Its business, `business/chats`, the
// office that keeps the chats of the bonds: the messages written there and
// what came back of each, the messages received there, how far she has read
// each chat; its personas, `self` and `known`, mounted below the kernel's
// nodes (generator.config.ts, `mounted`). No `auth/`: auth is the kernel's
// (EXT-1).

export const sight = {
  /** A business domain sees of another only its identities (GR-3). */
  business: { business: ['id'] },
  /** The leaves it adds to the kernel's personas (EXT-1), `self` and `known` only: they see the use cases, identities and facts of the business (GR-1). */
  persona: { business: ['usecase', 'id', 'fact'] },
} as const satisfies zz.Sight
