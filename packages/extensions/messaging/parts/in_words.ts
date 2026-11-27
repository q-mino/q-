import { the_words_of_the_chat as words } from '../texts/it.ts'
import {
  days_ago,
  the_date_of,
  the_hour_of,
  the_short_date_of,
  the_weekday_of,
  type ThePhoneOfTheChat,
} from './the_phone.ts'
import type { a_message, a_stage } from './what_it_reads.ts'

// The chat's instants and stages in its words (part M5): when, as a
// sentence (oggi alle 10:00, ieri alle 18:40, giovedì 26 novembre alle
// 9:30); when, in a line (10:00, ieri, lun, 26 nov); a day's heading; a
// stage, never told by a glyph alone (MSG-13).

/** When, as a sentence, in the phone's zone. */
export const when_in_words = (at: string, phone: ThePhoneOfTheChat): string => {
  const instant = new Date(at)
  const zone = phone.zone()
  const hour = the_hour_of(instant, zone)
  switch (days_ago(instant, phone.now(), zone)) {
    case 0:
      return words.the_times.today_at(hour)
    case 1:
      return words.the_times.yesterday_at(hour)
    default:
      return words.the_times.on_at(the_date_of(instant, zone), hour)
  }
}

/** When, in a line: the hour today, «ieri», the weekday within the week, else the date. */
export const when_in_a_line = (at: string, phone: ThePhoneOfTheChat): string => {
  const instant = new Date(at)
  const zone = phone.zone()
  const ago = days_ago(instant, phone.now(), zone)
  if (ago <= 0) return the_hour_of(instant, zone)
  if (ago === 1) return words.the_times.yesterday_short
  if (ago < 7) return the_weekday_of(instant, zone)
  return the_short_date_of(instant, zone)
}

/** The heading of a day of the conversation: «Oggi», «Ieri», or its date. */
export const the_day_in_words = (at: string, phone: ThePhoneOfTheChat): string => {
  const instant = new Date(at)
  const zone = phone.zone()
  switch (days_ago(instant, phone.now(), zone)) {
    case 0:
      return words.the_times.today
    case 1:
      return words.the_times.yesterday
    default:
      return the_date_of(instant, zone)
  }
}

/** The key of a message's day, to tell where a new day begins. */
export const the_day_key = (at: string, phone: ThePhoneOfTheChat): number =>
  -days_ago(new Date(at), phone.now(), phone.zone())

/** A stage in a word (MSG-13); on its way with no network, when it will leave. */
export const the_stage_in_words = (stage: a_stage, offline: boolean): string =>
  stage.stage === 'on_its_way' && offline
    ? `${words.the_stages.on_its_way}: ${words.when_there_is_a_network}`
    : words.the_stages[stage.stage]

/** Who wrote a message and when, to a screen reader: «Tu, oggi alle 10:00». */
export const by_whom_and_when = (message: a_message, phone: ThePhoneOfTheChat): string =>
  message.whose.whose === 'mine'
    ? words.the_conversation.by_me(when_in_words(message.at, phone))
    : words.the_conversation.by_them(when_in_words(message.at, phone))
