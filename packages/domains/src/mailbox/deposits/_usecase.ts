// generated

// The use cases of `mailbox/deposits` from `usecase.ts` (DOM-25): the same
// objects under the same names, each schema with its output type under the same
// name, so that one import gives both. Only this module imports `usecase.ts`.

import * as usecase from './usecase.ts'

/**
 * A depositor leaves an envelope on a mailbox: anyone, on any D.
 *
 * @see {@link usecase.deposit_an_envelope}
 */
export const deposit_an_envelope = usecase.deposit_an_envelope

/**
 * The relay throws an envelope away, seven days after its deposit: the return of its wait.
 *
 * @see {@link usecase.discard_an_envelope}
 */
export const discard_an_envelope = usecase.discard_an_envelope

/**
 * The holder collects the envelopes of its mailbox, from where it left off (F5).
 *
 * @see {@link usecase.the_envelopes_in_a_mailbox}
 */
export const the_envelopes_in_a_mailbox = usecase.the_envelopes_in_a_mailbox
