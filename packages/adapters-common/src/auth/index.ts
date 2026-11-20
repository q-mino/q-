// Auth's adapters (PER-9, PER-22, GR-4; part 13.2): the lookups of
// `auth/acquaintances` over the read use cases of `bonds` and `extensions`,
// as functions the configurator wires, on the oracle and on the phone.

export { the_acquaintances } from './acquaintances.ts'
export type {
  TheAcquaintances,
  TheAcquaintancesWiring,
  TheAddressBooksReads,
  TheOfficesOffers,
} from './acquaintances.ts'
