// The world of the reminders, faked for the oracle (TST-2): the members'
// phones, and a network whose next answer a test chooses (TST-4). A
// member's phone and a tool's name are not of `loans`: the delivery links
// them, the name from the state of `tools`. The three ways an effect fails
// (DOM-15): the network down is transient, a member with no phone or a
// network that gives up exhausts the entry, a dead letter an operator sees;
// a definitive outcome with a meaning would need a return, which a reminder
// has not.

import type * as wlib from '../../wlib.ts'
import type * as loans_effect from '../../@business/@loans/_effect.ts'
import type { member_id } from '../../@business/@loans/_id.ts'
import type { ToolsState } from './tools.ts'

/** A reminder as a phone receives it, with the key the network deduplicates on: effect and entry. */
export interface Reminder {
  readonly key: string
  readonly phone: string
  readonly tool_name: string
  readonly due_date: wlib.date_time_string
}

/** What the network does with the next message, as a test chooses. */
export type Network = 'delivers' | 'is_down' | 'gives_up'

/** The members' phones, the network, and what each phone received, for a test to look at. */
export interface Phones {
  readonly number_of: ReadonlyMap<member_id, string>
  readonly network: () => Network
  readonly receive: (reminder: Reminder) => void
}

const effect = 'business/loans/effect/send_the_due_date_reminder'

/** Sends Marta "bring the drill back tomorrow", at least once: the key lets the network drop a double. */
export const send_the_due_date_reminder =
  (get: () => ToolsState) =>
  (phones: Phones): wlib.Delivery<typeof loans_effect.send_the_due_date_reminder, never> =>
  (entry) => {
    const phone = phones.number_of.get(entry.payload.member_id)
    const network = phones.network()
    if (phone === undefined) {
      return Promise.resolve({ outcome: 'exhausted', reason: 'the member has no phone' })
    }
    if (network === 'is_down') {
      return Promise.resolve({ outcome: 'transient' })
    }
    if (network === 'gives_up') {
      return Promise.resolve({ outcome: 'exhausted', reason: 'the network gave up' })
    }
    phones.receive({
      key: `${effect}/${entry.id}`,
      phone: phone,
      tool_name: get().tools.get(entry.payload.tool_id)?.name ?? '',
      due_date: entry.payload.due_date,
    })
    return Promise.resolve({ outcome: 'delivered' })
  }
