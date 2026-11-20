// The `memory` configurator (CFG-3): the phone and the relay in one process,
// the stack of q-'s oracles (TST-2). Since part 8.2 the relay over the oracle
// of `mailbox`; the phones come with the stack (step 17).

export * from './oracle/index.ts'
export { relay, the_desks_interface, the_scope_of_a_deposit } from './relay/index.ts'
export type { HashOfACollectSecret, Relay, Release, Shown, World } from './relay/index.ts'
