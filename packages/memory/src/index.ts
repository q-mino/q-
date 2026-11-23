// The `memory` configurator (CFG-3): the phones and the relay in one process,
// the stack of q-'s oracles (TST-2). Since part 8.2 the relay over the oracle
// of `mailbox`; since step 17 the phone over the oracles of the kernel's
// domains, and the stack of them both over the transports in process.

export * from './oracle/index.ts'
export { relay, the_desks_interface, the_scope_of_a_deposit } from './relay/index.ts'
export type { HashOfACollectSecret, Relay, Release, Shown, World } from './relay/index.ts'
export { a_new_phone, on_the_cell, phone, TheExtensionsDoNotCompose } from './phone/index.ts'
export type {
  AnExtensionThatDoesNotCompose,
  AnExtensionHostedOnThePhone,
  AnExtensionOfTheApp,
  APhonesPartitions,
  Phone,
  PhoneCell,
  PhoneState,
  PhoneStorage,
  Release as PhoneRelease,
  TheRealmsHost,
  World as PhoneWorld,
} from './phone/index.ts'
export { a_stack, the_relay_s_transports } from './stack/index.ts'
export type {
  APhoneOverTheRelay,
  APhonesWorld,
  Stack,
  TheDesk,
  TheDesksSide,
  TheRelaysTransports,
  TheStacksWorld,
} from './stack/index.ts'
