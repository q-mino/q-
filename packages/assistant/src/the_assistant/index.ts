// The assistant (AST-1..AST-6, AST-12, AST-13): the user of its node. At its
// first start its face, messaging and ping pong active (AST-2); at each look
// the welcome on each bond kept (AST-5), then the turns, one at a time, the
// oldest first (AST-4), each through its caps (AST-6) to the answerer
// (AST-7), the reply kept in the register before anything is written, the
// note written (AST-12), the reply written under the operation derived from
// the bond and the turn's last message, the chat read up to it; the stand
// topped up (AST-13). Over the node's side (`the_node_s_side.ts`), so the
// same code runs over a phone of the stack and over the node in Node.
// [Q, C, 27 Nov 2026]

import { the_link_of_a_ticket, the_mark_of_a_ticket } from '@q-mino/adapters-web'
import type { Answers, ATurnAsked } from '../answerer/index.ts'
import { a_note_written } from '../notes/index.ts'
import type { ATurnInProgress, HowItCloses, TheRegister } from '../register/index.ts'
import type { TheStand } from '../stand/index.ts'
import { words } from '../texts/index.ts'
import type { AnExtensionCarried, TheNodesSide } from './the_node_s_side.ts'

export {
  over_a_phone,
  the_zone,
  type AMessageOfAChat,
  type AnExtensionCarried,
  type TheNodesSide,
} from './the_node_s_side.ts'

/** The caps (AST-6) and the stand's numbers (AST-13), each a setting (AST-14). */
export interface TheNumbers {
  readonly turns_per_bond: number
  readonly turns_per_day: number
  readonly attempts: number
  readonly on_the_stand: number
  readonly tickets_per_day: number
  readonly takeable_for_hours: number
  /** How long after a `not_logged_in` one turn is tried again (AST-7). */
  readonly logged_out_pause_minutes: number
}

/** The numbers of B1's design (AST-6, AST-13). */
export const the_numbers: TheNumbers = {
  turns_per_bond: 15,
  turns_per_day: 60,
  attempts: 2,
  on_the_stand: 5,
  tickets_per_day: 20,
  takeable_for_hours: 24,
  logged_out_pause_minutes: 10,
}

/** What the assistant works with. */
export interface TheAssistantsWiring {
  readonly node: TheNodesSide
  readonly register: TheRegister
  readonly answers: Answers
  /** The copy the answerer reads now (AST-11). */
  readonly the_copy: () => string
  /** The notes' folder (AST-12). */
  readonly notes: string
  readonly stand: TheStand
  /** The page of the links (the test site), which the stand's tickets are read by (WEB-1). */
  readonly app: string
  readonly draws_an_id: () => string
  /** Until a condition holds, the node at work meanwhile; a fault if it never does. */
  readonly waits_until: (holds: () => Promise<boolean>, what: string) => Promise<void>
  /** A line of its journal (AST-14): never a text, a name or a bond. */
  readonly journal: (line: string) => void
  readonly numbers?: TheNumbers
  /** The instants of the answerer's work (its duration in the journal); the system's unless given. */
  readonly monotonic?: () => number
}

/** The day of an instant, in Rome (AST-6): `YYYY-MM-DD`. */
export const the_day_of = (instant: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(instant))

/** What the caps decide for a bond's next turn (AST-6). */
export type ACapsDecision =
  'answer' | 'the_notice_of_a_bond_s_cap' | 'the_notice_of_the_day_s_cap' | 'pass_over'

/**
 * The caps (AST-6) over the turns closed today: a reply, the apology and a
 * notice count as the turn they close, a turn passed over counts nothing;
 * over the day's, each bond's notice once; over the bond's, its notice
 * once; a bond told either is passed over until the next day (one notice a
 * day per bond at most).
 */
export const the_caps_decide = (
  closed_today: readonly { readonly bond: string; readonly how: HowItCloses }[],
  bond: string,
  numbers: Pick<TheNumbers, 'turns_per_bond' | 'turns_per_day'>,
): ACapsDecision => {
  const counted = closed_today.filter((turn) => turn.how !== 'passed_over')
  const of_the_bond = counted.filter((turn) => turn.bond === bond)
  // A bond told either notice today is passed over until tomorrow.
  if (
    of_the_bond.some(
      (turn) =>
        turn.how === 'the_notice_of_a_bond_s_cap' || turn.how === 'the_notice_of_the_day_s_cap',
    )
  )
    return 'pass_over'
  if (counted.length >= numbers.turns_per_day) return 'the_notice_of_the_day_s_cap'
  if (of_the_bond.length >= numbers.turns_per_bond) return 'the_notice_of_a_bond_s_cap'
  return 'answer'
}

/**
 * The last of a chat's messages, at most so many and so many characters,
 * the oldest dropped first: the recent ones a turn is told with (AST-4:
 * twelve, 12 000 characters), and those it covers (eight, 12 000: B6, a
 * flood of messages before a look would be one prompt as long as the flood,
 * of Alessandro's quota). The last one always (a message is at most 4 000,
 * MSG-4).
 */
export const the_last = <message extends { readonly text: string }>(
  messages: readonly message[],
  at_most: { readonly messages: number; readonly characters: number },
): readonly message[] => {
  const kept: message[] = []
  let characters = 0
  for (const message of [...messages].reverse()) {
    if (
      kept.length >= at_most.messages ||
      (kept.length > 0 && characters + message.text.length > at_most.characters)
    )
      break
    kept.unshift(message)
    characters += message.text.length
  }
  return kept
}

/** How much of the chat before a turn it is told (AST-4). */
const the_recent = { messages: 12, characters: 12_000 } as const

/** How much of what a turn covers it is told [Q, C, 28 Nov 2026] (B6; AST-4): the rest is told by its number. */
export const the_covered = { messages: 8, characters: 12_000 } as const

/** The operations the assistant names (DOM-11): the same after a fall. */
export const the_operations = {
  welcome: (bond: string): string => `assistant/welcome/${bond}`,
  reply: (bond: string, through: string): string => `assistant/reply/${bond}/${through}`,
  read: (bond: string, through: string): string => `assistant/read/${bond}/${through}`,
  leave: (bond: string): string => `assistant/leave/${bond}`,
} as const

/** A turn's identity (AST-12's name of a note): its bond and its last message. */
export const the_identity_of = (turn: Pick<ATurnInProgress, 'bond' | 'through'>): string =>
  `${turn.bond}/${turn.through}`

/** The assistant over its wiring. */
export const the_assistant = (wiring: TheAssistantsWiring) => {
  const numbers = wiring.numbers ?? the_numbers
  const monotonic = wiring.monotonic ?? (() => performance.now())
  const { node, register } = wiring
  /** Until when no turn is asked of the answerer, after a `not_logged_in` (AST-7). */
  let logged_out_until: string | undefined = undefined

  /** An activity asked and waited for to its end (USR-2). */
  const asks_and_it_ends = async (
    activity_id: string,
    what: Parameters<TheNodesSide['asks']>[1],
  ) => {
    await node.asks(activity_id, what)
    await wiring.waits_until(
      async () => (await node.the_end_of(activity_id)) !== undefined,
      `the end of ${what.activity}`,
    )
    return node.the_end_of(activity_id)
  }

  /** The face of the assistant: its first. */
  const the_face = async (): Promise<string | undefined> => (await node.my_faces())[0]

  /**
   * The first start (AST-2): the face «Assistente di Cumino» made if there
   * is none; messaging and ping pong activated if they are not, their
   * manifests accepted as shown (EXT-7, USR-7). A later start makes nothing.
   */
  const first_start = async (): Promise<{ readonly made: readonly string[] }> => {
    const made: string[] = []
    if ((await the_face()) === undefined) {
      const ended = await asks_and_it_ends('the-first-face', {
        activity: 'make_my_first_face',
        face: 'assistente',
        name: words.the_face,
      })
      if (ended?.ended !== 'done')
        throw new Error(`the face was not made: ${ended?.ended ?? 'no end'}`)
      made.push('the face')
    }
    const carried: readonly AnExtensionCarried[] = ['messaging', 'ping_pong']
    for (const extension of carried) {
      if (await node.is_active(extension)) continue
      const ended = await asks_and_it_ends(`activate-${extension}-${wiring.draws_an_id()}`, {
        activity: 'activate_an_extension',
        manifest: node.the_manifest_shown(extension),
      })
      if (ended?.ended !== 'done' && ended?.ended !== 'done_already')
        throw new Error(`${extension} was not activated: ${ended?.ended ?? 'no end'}`)
      made.push(extension)
    }
    return { made }
  }

  /** The welcome (AST-5) on each bond whose chat holds nothing of the assistant's, under the operation of the bond. */
  const the_welcomes = async (bonds: readonly string[]): Promise<number> => {
    let written = 0
    for (const bond of bonds) {
      const chat = await node.a_chat(bond)
      if (chat.some((message) => message.whose === 'mine')) continue
      if (await node.writes(bond, words.the_welcome, the_operations.welcome(bond))) written += 1
      else wiring.journal('a welcome was not written')
    }
    return written
  }

  /** The turns waiting (AST-4): those in progress, then a bond's messages to read; the oldest first. */
  const the_turns_waiting = async (
    bonds: readonly string[],
  ): Promise<readonly ATurnInProgress[]> => {
    const in_progress = register.turns_in_progress()
    const opened: ATurnInProgress[] = []
    for (const bond of bonds) {
      if (in_progress.some((turn) => turn.bond === bond)) continue
      const to_read = await node.to_read(bond)
      if (to_read === 0) continue
      const covered = (await node.a_chat(bond))
        .filter((message) => message.whose === 'theirs')
        .slice(-to_read)
      const first = covered[0]
      const last = covered.at(-1)
      if (first === undefined || last === undefined) continue
      opened.push({
        bond,
        through: last.message_id,
        first_at: first.at,
        stage: { stage: 'asked', attempts: 0 },
      })
    }
    return [...in_progress, ...opened].sort(
      (one, other) =>
        one.first_at.localeCompare(other.first_at) || one.bond.localeCompare(other.bond),
    )
  }

  /** What a turn asks the answerer (AST-4): the chat before it, and the messages it covers, up to its last. */
  const what_is_asked = async (turn: ATurnInProgress): Promise<ATurnAsked> => {
    const chat = await node.a_chat(turn.bond)
    const to_read = await node.to_read(turn.bond)
    const through = chat.find((message) => message.message_id === turn.through)
    const covered = chat
      .filter((message) => message.whose === 'theirs')
      .slice(to_read === 0 ? chat.length : -to_read)
      .filter((message) => through === undefined || message.place <= through.place)
    const first = covered[0]
    const told = the_last(covered, the_covered)
    return {
      before: the_last(
        chat
          .filter((message) => first === undefined || message.place < first.place)
          .map((message) => ({ whose: message.whose, text: message.text })),
        the_recent,
      ),
      covered: told.map((message) => message.text),
      ...(told.length < covered.length ? { left_out: covered.length - told.length } : {}),
    }
  }

  /** A turn's stage kept in the register; the turn as it is now. */
  const kept = (turn: ATurnInProgress, stage: ATurnInProgress['stage']): ATurnInProgress => {
    const now = { ...turn, stage }
    register.keeps(now)
    return now
  }

  /** The words of a notice or of the apology, by how its turn closes. */
  const the_words_closing: Readonly<
    Record<Exclude<HowItCloses, 'replied' | 'passed_over'>, string>
  > = {
    the_apology: words.the_apology,
    the_notice_of_a_bond_s_cap: words.the_notice_of_a_bond_s_cap,
    the_notice_of_the_day_s_cap: words.the_notice_of_the_day_s_cap,
  }

  /**
   * A turn run from its stage to its close (AST-4, AST-6, AST-7); `waits`
   * when the answerer is not logged in (the turn left `asked`, no attempt
   * counted) or a write did not go (left as the register has it).
   */
  const runs = async (from: ATurnInProgress): Promise<'closed' | 'waits'> => {
    let turn = from
    for (;;) {
      const now = node.now()
      const day = the_day_of(now)
      switch (turn.stage.stage) {
        case 'asked': {
          const attempts_so_far = turn.stage.attempts
          const decided = the_caps_decide(register.closed_on(day), turn.bond, numbers)
          if (decided === 'pass_over') {
            turn = kept(turn, { stage: 'written', closes_as: 'passed_over' })
            break
          }
          if (decided !== 'answer') {
            turn = kept(turn, {
              stage: 'kept',
              reply: the_words_closing[decided],
              closes_as: decided,
            })
            break
          }
          if (logged_out_until !== undefined && now < logged_out_until) return 'waits'
          // Every attempt begun ended by a fall of the node (B6): the apology, not one more.
          if (attempts_so_far >= numbers.attempts) {
            wiring.journal('a turn whose attempts ended in falls: the apology')
            turn = kept(turn, { stage: 'kept', reply: words.the_apology, closes_as: 'the_apology' })
            break
          }
          const asked = await what_is_asked(turn)
          if (asked.covered.length === 0) {
            turn = kept(turn, { stage: 'written', closes_as: 'passed_over' })
            break
          }
          // The attempt counted as it begins [Q, C, 28 Nov 2026] (B6; AST-6): a fall
          // of the node during it (the container killed, the laptop's power) counts,
          // so a turn that kills its node is not asked again at every start, each of
          // Alessandro's quota. A stop or a missing login gives it back.
          const before_it = turn
          const given_back = (): void => {
            kept(before_it, { stage: 'asked', attempts: attempts_so_far })
          }
          turn = kept(turn, { stage: 'asked', attempts: attempts_so_far + 1 })
          const started = monotonic()
          const answer = await wiring.answers(asked, wiring.the_copy())
          const seconds = ((monotonic() - started) / 1000).toFixed(1)
          if (answer.answer === 'replied') {
            wiring.journal(
              `a turn answered in ${seconds} s${answer.cost === undefined ? '' : ` (Claude Code's estimate $${answer.cost.toFixed(3)})`}${answer.note === undefined ? '' : ', with a note'}`,
            )
            logged_out_until = undefined
            turn = kept(turn, {
              stage: 'kept',
              reply: answer.reply,
              ...(answer.note === undefined ? {} : { note: answer.note }),
              closes_as: 'replied',
            })
            break
          }
          if (answer.answer === 'stopped') {
            given_back()
            return 'waits'
          }
          if (answer.answer === 'over_its_budget') {
            wiring.journal(`an attempt over its budget in ${seconds} s: the apology`)
            turn = kept(turn, { stage: 'kept', reply: words.the_apology, closes_as: 'the_apology' })
            break
          }
          if (answer.answer === 'not_logged_in') {
            given_back()
            if (logged_out_until === undefined)
              wiring.journal('the answerer is not logged in: the turns wait')
            logged_out_until = new Date(
              Date.parse(now) + numbers.logged_out_pause_minutes * 60_000,
            ).toISOString()
            return 'waits'
          }
          wiring.journal(
            answer.answer === 'failed'
              ? `an attempt failed in ${seconds} s (exit ${String(answer.exit)}): ${answer.fault}`
              : `an attempt ${answer.answer === 'over_its_time' ? 'over its time' : 'out of its form'} in ${seconds} s`,
          )
          const attempts = attempts_so_far + 1
          turn =
            attempts >= numbers.attempts
              ? kept(turn, { stage: 'kept', reply: words.the_apology, closes_as: 'the_apology' })
              : kept(turn, { stage: 'asked', attempts })
          break
        }
        case 'kept': {
          if (turn.stage.note !== undefined) {
            a_note_written(wiring.notes, turn.stage.note, day, the_identity_of(turn))
            wiring.journal('a note written')
          }
          const written = await node.writes(
            turn.bond,
            turn.stage.reply,
            the_operations.reply(turn.bond, turn.through),
          )
          if (!written) {
            wiring.journal('a reply was not written: its turn waits')
            return 'waits'
          }
          turn = kept(turn, { stage: 'written', closes_as: turn.stage.closes_as })
          break
        }
        case 'written': {
          const read = await node.reads_up_to(
            turn.bond,
            turn.through,
            the_operations.read(turn.bond, turn.through),
          )
          if (!read) wiring.journal('a chat was not marked read')
          register.closes(turn, day, turn.stage.closes_as)
          wiring.journal(`a turn closed: ${turn.stage.closes_as}`)
          return 'closed'
        }
      }
    }
  }

  /**
   * A look (AST-4, AST-5): the welcome on each bond kept, then every turn
   * waiting, one at a time, the oldest first. How many welcomes, turns
   * closed and turns waiting.
   */
  const a_look = async (): Promise<{
    readonly welcomes: number
    readonly closed: number
    readonly waiting: number
  }> => {
    const bonds = await node.my_bonds()
    const welcomes = await the_welcomes(bonds)
    let closed = 0
    let waiting = 0
    for (const turn of await the_turns_waiting(bonds)) {
      if ((await runs(turn)) === 'closed') closed += 1
      else waiting += 1
    }
    return { welcomes, closed, waiting }
  }

  /** A ticket's text as its link carries it after `ticket=` (WEB-1). */
  const the_text_of = (ticket: Parameters<ReturnType<typeof the_link_of_a_ticket>>[0]): string => {
    const link = new URL(the_link_of_a_ticket(wiring.app)(ticket))
    return link.hash.slice(1 + the_mark_of_a_ticket.length)
  }

  /**
   * The stand topped up (AST-13): while it holds fewer than five it can
   * still give and fewer than twenty tickets were prepared today, a ticket
   * prepared for a link, waited for ready, and left signed, takeable for 24
   * hours from when it was asked; one at a time. How many were left.
   */
  const the_stand_topped_up = async (): Promise<number> => {
    const face = await the_face()
    if (face === undefined) return 0
    const counted = await wiring.stand.counts(node.now())
    if (counted.counted === 'out_of_reach') {
      wiring.journal(`the stand out of reach: ${counted.fault}`)
      return 0
    }
    let on_the_stand = counted.takeable
    let left = 0
    while (
      on_the_stand < numbers.on_the_stand &&
      register.tickets_prepared_on(the_day_of(node.now())) < numbers.tickets_per_day
    ) {
      const asked_at = node.now()
      const bond = wiring.draws_an_id()
      register.a_ticket_prepared(bond, the_day_of(asked_at))
      const ended = await asks_and_it_ends(`ticket-${bond}`, {
        activity: 'prepare_a_ticket',
        bond,
        face,
      })
      if (ended?.ended !== 'done') {
        wiring.journal(`a ticket was not prepared: ${ended?.ended ?? 'no end'}`)
        break
      }
      await wiring.waits_until(
        async () => (await node.the_ticket_shown(bond)) !== undefined,
        'a ticket ready',
      )
      const ticket = await node.the_ticket_shown(bond)
      if (ticket === undefined) break
      const answer = await wiring.stand.leaves({
        operation: the_operations.leave(bond),
        ticket: the_text_of(ticket),
        takeable_until: new Date(
          Date.parse(asked_at) + numbers.takeable_for_hours * 3_600_000,
        ).toISOString(),
      })
      if (answer.left !== 'the_invitation_is_on_the_stand') {
        wiring.journal(
          `a ticket not left: ${answer.left}${answer.left === 'out_of_reach' ? ` (${answer.fault})` : ''}`,
        )
        break
      }
      on_the_stand += 1
      left += 1
    }
    if (left > 0)
      wiring.journal(`the stand topped up: ${String(left)} left, ${String(on_the_stand)} on it`)
    return left
  }

  return { first_start, a_look, the_stand_topped_up }
}

/** The assistant, as `the_assistant` makes it. */
export type TheAssistant = ReturnType<typeof the_assistant>
