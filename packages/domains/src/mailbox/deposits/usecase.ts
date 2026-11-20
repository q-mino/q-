import { command_use_case, read_use_case, command, effect, query } from './_scope_usecase.ts'

// The use cases of `deposits`, its only entry (DOM-2): the desk's personas
// and the effect executor reach the mailbox through them.

/** A depositor leaves an envelope on a mailbox: anyone, on any D. */
export const deposit_an_envelope = command_use_case({ command: command.deposit_an_envelope })

/** The relay throws an envelope away, seven days after its deposit: the return of its wait. */
export const discard_an_envelope = command_use_case({
  command: command.discard_an_envelope,
  returns_from: effect.wait_seven_days_from_the_deposit,
})

/** The holder collects the envelopes of its mailbox, from where it left off (F5). */
export const the_envelopes_in_a_mailbox = read_use_case({ query: query.the_envelopes_in_a_mailbox })
