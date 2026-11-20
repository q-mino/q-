import type * as zz from '../../domains/src/library/index.ts'

// What each folder of the test extension's tree sees of the others (DOM-25,
// EXT-11): the architecture's rules for its kinds (EXT-11), as Shed's map
// gives them. Its business, `business/greetings`, the office that greets
// the bonds and keeps what came back; its personas, `self` and `known`,
// mounted below the kernel's nodes (generator.config.ts, `mounted`). No
// `auth/`: auth is the kernel's (EXT-1).

export const sight = {
  /** A business domain sees of another only its identities (GR-3). */
  business: { business: ['id'] },
  /** The leaves it adds to the kernel's personas (EXT-1), `self` and `known` only: they see the use cases, identities and facts of the business (GR-1). */
  persona: { business: ['usecase', 'id', 'fact'] },
} as const satisfies zz.Sight
