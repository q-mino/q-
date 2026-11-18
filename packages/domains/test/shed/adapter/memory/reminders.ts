// The world of the reminders and the notices, faked for the oracle (TST-2):
// the members' phones, and a network whose next answer a test chooses
// (TST-4). A member's phone and a tool's name are not of `loans`: the
// delivery links them, the name from the state of `tools`. The three ways an
// effect fails (DOM-15): the network down is transient, a member with no
// phone or a network that gives up exhausts the entry, a dead letter an
// operator sees; a definitive outcome with a meaning would need a return,
// which neither a reminder nor a notice has.

import type * as wlib from '../../wlib.ts'
import type * as loans_effect from '../../business/loans/_effect.ts'
import type { member_id } from '../../business/loans/_id.ts'
import type { ToolsState } from './tools.ts'

/** A reminder as a phone receives it, with the key the network deduplicates on: effect and entry. */
export interface Reminder {
  readonly message: 'due_date_reminder'
  readonly key: string
  readonly phone: string
  readonly tool_name: string
  readonly due_day: wlib.day
}

/** A notice of a repair as a phone receives it: the tool booked, and the day it was booked for. */
export interface RepairNotice {
  readonly message: 'repair_notice'
  readonly key: string
  readonly phone: string
  readonly tool_name: string
  readonly day: wlib.day
}

/**
 * The week's summary as a phone receives it: the week, from its Monday; the
 * phone opens the member's loans and reservations, read when they look
 * (SC-43).
 */
export interface WeeksSummary {
  readonly message: 'weeks_summary'
  readonly key: string
  readonly phone: string
  readonly monday: wlib.day
}

/** What a phone receives from the shed. */
export type Message = Reminder | RepairNotice | WeeksSummary

/** What the network does with the next message, as a test chooses. */
export type Network = 'delivers' | 'is_down' | 'gives_up'

/** The members' phones, the network, and what each phone received, for a test to look at. */
export interface Phones {
  readonly number_of: ReadonlyMap<member_id, string>
  readonly network: () => Network
  readonly receive: (message: Message) => void
}

/**
 * Sends a member a message, at least once: no phone or a network that gives
 * up exhausts the entry, a network down is transient.
 */
const send =
  (phones: Phones) =>
  (to: { readonly member_id: member_id; readonly message: (phone: string) => Message }) => {
    const phone = phones.number_of.get(to.member_id)
    const network = phones.network()
    if (phone === undefined) {
      return Promise.resolve<wlib.Delivered<never>>({
        outcome: 'exhausted',
        reason: 'the member has no phone',
      })
    }
    if (network === 'is_down') {
      return Promise.resolve<wlib.Delivered<never>>({ outcome: 'transient' })
    }
    if (network === 'gives_up') {
      return Promise.resolve<wlib.Delivered<never>>({
        outcome: 'exhausted',
        reason: 'the network gave up',
      })
    }
    phones.receive(to.message(phone))
    return Promise.resolve<wlib.Delivered<never>>({ outcome: 'delivered' })
  }

/** Sends Marta "bring the drill back tomorrow", at least once: the key lets the network drop a double. */
export const send_the_due_date_reminder =
  (get: () => ToolsState) =>
  (phones: Phones): wlib.Delivery<typeof loans_effect.send_the_due_date_reminder, never> =>
  (entry) =>
    send(phones)({
      member_id: entry.payload.member_id,
      message: (phone) => ({
        message: 'due_date_reminder',
        key: `business/loans/effect/send_the_due_date_reminder/${entry.id}`,
        phone: phone,
        tool_name: get().tools.get(entry.payload.tool_id)?.name ?? '',
        due_day: entry.payload.due_day,
      }),
    })

/**
 * Sends Gianni "the drill you booked for Thursday is in repair", at least
 * once: the key, the stay in repair and the reservation, lets the network
 * drop a double, and a second repair is a second notice.
 */
export const send_the_repair_notice =
  (get: () => ToolsState) =>
  (phones: Phones): wlib.Delivery<typeof loans_effect.send_the_repair_notice, never> =>
  (entry) =>
    send(phones)({
      member_id: entry.payload.member_id,
      message: (phone) => ({
        message: 'repair_notice',
        key: `business/loans/effect/send_the_repair_notice/${entry.id}`,
        phone: phone,
        tool_name: get().tools.get(entry.payload.tool_id)?.name ?? '',
        day: entry.payload.day,
      }),
    })

/**
 * Sends Marta "your week at the shed, from Monday 23 November", at least
 * once: the key, the member and the Monday, lets the network drop a double.
 * The summary carries the week only; her phone reads the rest when she
 * opens it, so it is never a week stale (SC-43).
 */
export const send_the_weeks_summary =
  (phones: Phones): wlib.Delivery<typeof loans_effect.send_the_weeks_summary, never> =>
  (entry) =>
    send(phones)({
      member_id: entry.payload.member_id,
      message: (phone) => ({
        message: 'weeks_summary',
        key: `business/loans/effect/send_the_weeks_summary/${entry.id}`,
        phone: phone,
        monday: entry.payload.monday,
      }),
    })
