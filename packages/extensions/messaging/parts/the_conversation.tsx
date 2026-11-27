import { useSignal, type Signal } from '@preact/signals'
import type * as boundary from '@q-mino/boundary'
import { useEffect, useRef } from 'preact/hooks'
import { the_words_of_the_chat as words } from '../texts/it.ts'
import { Glyph, the_glyph_of } from './glyphs.tsx'
import {
  by_whom_and_when,
  the_day_in_words,
  the_day_key,
  the_stage_in_words,
  when_in_words,
} from './in_words.ts'
import { the_hour_of, type ThePhoneOfTheChat } from './the_phone.ts'
import {
  a_chat_after,
  follows,
  in_its_order,
  invokes,
  it_may_be_sent_again,
  the_version,
  type a_chat_read,
  type a_message,
} from './what_it_reads.ts'

// The conversation (MSG-7, MSG-6, MSG-13; part M5): the chat on the whole
// screen, as a phone's messaging app draws one. It follows `a_chat` while it
// is shown (K-4), again each time it is shown again (G-2: a message held or
// put aside is told at its next showing); the messages in the order her
// node filed them (MSG-5), the newest at the bottom against the field, the
// older ones a page at a time as she goes up (the read gives the chat whole,
// K-9: the pages are the drawing's); each of hers with where it stands in
// words (MSG-13) and, when it was not delivered, «Invia di nuovo», the same
// text as a message of its own; each with its annotations at a tap (MSG-6);
// the field and «Invia» (`write_a_message`), the focus kept on the field;
// read up to the last of theirs shown once it is in view (`read_a_chat`, a
// part acting with no tap of hers, EXT-16); what comes told politely to a
// screen reader.

/** How many messages a page shows, the newest first. */
const a_page = 50

/** How the last message from the field went: nothing to tell, being written, or not written (the kernel did not serve it). */
type how_it_was_written = 'nothing' | 'writing' | 'not_written'

/** A list of messages that is at its newest end, within a finger: a reversed column, whose bottom is 0. */
const at_the_newest = (messages: HTMLElement | null): boolean =>
  messages !== null && Math.abs(messages.scrollTop) < 48

/** A list of messages near its oldest end, where an older page is shown. */
const near_the_oldest = (messages: HTMLElement): boolean =>
  messages.scrollHeight - messages.clientHeight - Math.abs(messages.scrollTop) < 96

/** The first words of a text, for what a screen reader is told. */
const the_first_words = (text: string): string =>
  text.length > 120 ? `${text.slice(0, 120)}…` : text

/**
 * What a screen reader is told of a change of the chat (politely, as it
 * comes): a message of theirs that came, or one of hers whose stage moved
 * from on its way; nothing at the first reading.
 */
const what_is_told = (before: a_chat_read, after: a_chat_read): readonly string[] => {
  if (before.read !== 'read' || after.read !== 'read') return []
  const told: string[] = []
  for (const message of in_its_order(after.messages)) {
    const was = before.messages.get(message.message_id)
    if (message.whose.whose === 'theirs') {
      if (was === undefined) told.push(words.announced.theirs(the_first_words(message.text)))
    } else if (
      message.whose.stage.stage !== 'on_its_way' &&
      (was?.whose.whose !== 'mine' || was.whose.stage.stage !== message.whose.stage.stage)
    ) {
      told.push(
        words.announced.mine(
          words.the_stages[message.whose.stage.stage],
          the_first_words(message.text),
        ),
      )
    }
  }
  return told
}

/** What was told, the last few, each added to the polite region, so that two changes at once are both told. */
interface ATold {
  readonly key: number
  readonly said: string
}

/** The annotations of a message (MSG-6, MSG-13): theirs what her node can tell of it; hers when written and where it stands. */
const TheAnnotations = (props: {
  id: string
  message: a_message
  shown: boolean
  offline: boolean
  phone: ThePhoneOfTheChat
}) => {
  const its = words.the_annotations
  const whose = props.message.whose
  return (
    <dl id={props.id} data-part="annotations" hidden={!props.shown}>
      {whose.whose === 'theirs' ? (
        <>
          <dt>{its.received}</dt>
          <dd>{its.received_by(when_in_words(props.message.at, props.phone))}</dd>
          <dt>{its.declared}</dt>
          <dd>{its.declared_by(when_in_words(whose.declared_at, props.phone))}</dd>
          <dt>{its.signature}</dt>
          <dd>{its.signature_valid}</dd>
          <dt>{its.mailbox}</dt>
          <dd>{its.the_bond_s_mailbox}</dd>
          <dt>{its.relay}</dt>
          <dd>{its.relay_missing}</dd>
        </>
      ) : (
        <>
          <dt>{its.written}</dt>
          <dd>{when_in_words(props.message.at, props.phone)}</dd>
          <dt>{its.stage}</dt>
          <dd>
            {`${words.the_stages[whose.stage.stage]}: ${
              whose.stage.stage === 'on_its_way' && props.offline
                ? its.why.on_its_way_with_no_network
                : its.why[whose.stage.stage]
            }`}
          </dd>
          {'at' in whose.stage && (
            <>
              <dt>{its.learned}</dt>
              <dd>{its.learned_by(when_in_words(whose.stage.at, props.phone))}</dd>
            </>
          )}
        </>
      )}
    </dl>
  )
}

/** A message of the conversation: who and when for a screen reader, its text, its time and stage (its annotations at a tap), «Invia di nuovo» when it was not delivered. */
const AMessage = (props: {
  message: a_message
  day: string | undefined
  bond: string
  opened: boolean
  toggles: () => void
  offline: boolean
  phone: ThePhoneOfTheChat
  sends_again: () => void
}) => {
  const message = props.message
  const whose = message.whose
  const annotations = `the-chat-${props.bond}-${message.message_id}`
  return (
    <li
      data-part="a-message"
      data-whose={whose.whose}
      data-state={whose.whose === 'mine' ? whose.stage.stage : 'received'}
    >
      {props.day !== undefined && (
        <>
          <p data-part="day" aria-hidden="true">
            {props.day}
          </p>{' '}
        </>
      )}
      <div
        data-part="bubble"
        onClick={(event) => {
          // A tap on the bubble opens its annotations, as its gesture does; not over the gesture, nor a selection.
          const on = event.target
          if (on instanceof Element && on.closest('button, dl') !== null) return
          if ((window.getSelection()?.toString() ?? '') !== '') return
          props.toggles()
        }}
      >
        <span data-part="for-a-screen-reader">{by_whom_and_when(message, props.phone)}: </span>
        <p data-part="text">{message.text}</p>{' '}
        <button
          type="button"
          data-part="meta"
          aria-expanded={props.opened}
          aria-controls={annotations}
          onClick={props.toggles}
        >
          <time dateTime={message.at}>{the_hour_of(new Date(message.at), props.phone.zone())}</time>
          {whose.whose === 'mine' && (
            <>
              {' '}
              <span data-part="stage" data-state={whose.stage.stage}>
                <Glyph glyph={the_glyph_of(whose.stage)} />
                {the_stage_in_words(whose.stage, props.offline)}
              </span>
            </>
          )}
          <span data-part="for-a-screen-reader">{`, ${words.the_conversation.details}`}</span>
        </button>
        <TheAnnotations
          id={annotations}
          message={message}
          shown={props.opened}
          offline={props.offline}
          phone={props.phone}
        />
      </div>
      {whose.whose === 'mine' && it_may_be_sent_again(whose.stage) && (
        <button type="button" data-part="send-again" onClick={props.sends_again}>
          <Glyph glyph="rotate" />
          {words.the_conversation.send_again}
        </button>
      )}
    </li>
  )
}

export const TheConversation = (props: {
  bond: string
  door: boundary.APartsDoor
  shown: boolean
  phone: ThePhoneOfTheChat
  /** What she is writing, kept by the part while it is drawn, in its place and on the whole screen alike. */
  text: Signal<string>
}) => {
  const chat = useSignal<a_chat_read>({ read: 'reading' })
  const again = useSignal(0)
  const pages = useSignal(1)
  const written = useSignal<how_it_was_written>('nothing')
  const opened = useSignal<string | undefined>(undefined)
  const told = useSignal<readonly ATold[]>([])
  const offline = useSignal(props.phone.offline())
  const the_messages = useRef<HTMLDivElement>(null)
  const the_field = useRef<HTMLTextAreaElement>(null)
  const read_up_to = useRef<string | undefined>(undefined)
  const reads = again.value

  // Followed while shown, again once shown again (K-4, G-2).
  useEffect(() => {
    if (!props.shown) return
    return follows(
      props.door,
      { use_case: 'usecase/a_chat', version: the_version, input: { bond: props.bond } },
      (heard) => {
        const before = chat.peek()
        const after = a_chat_after(before, heard)
        chat.value = after.chat
        const said = what_is_told(before, after.chat)
        if (said.length > 0) {
          const last = told.peek().at(-1)?.key ?? 0
          told.value = [
            ...told.peek(),
            ...said.map((one, at) => ({ key: last + at + 1, said: one })),
          ].slice(-4)
        }
        if (after.then === 'reads_again') again.value += 1
      },
    )
  }, [props.shown, props.bond, reads])

  useEffect(
    () =>
      props.phone.when_the_network_changes(() => {
        offline.value = props.phone.offline()
      }),
    [],
  )

  /** Read up to the last of theirs, once it is in view (MSG-7): with no tap of hers, each message once. */
  const marks_it_read = (): void => {
    const it = chat.peek()
    if (!props.shown || it.read !== 'read' || !at_the_newest(the_messages.current)) return
    const theirs = in_its_order(it.messages)
      .filter((one) => one.whose.whose === 'theirs')
      .at(-1)
    if (theirs === undefined || read_up_to.current === theirs.message_id) return
    read_up_to.current = theirs.message_id
    void invokes(props.door, {
      use_case: 'usecase/read_a_chat',
      version: the_version,
      input: { bond: props.bond, up_to: theirs.message_id },
    }).then((answered) => {
      const read = answered.answered === 'an_event' && answered.event === 'the_chat_is_read'
      if (!read && read_up_to.current === theirs.message_id) read_up_to.current = undefined
    })
  }

  // After each drawing: what is in view is read.
  useEffect(() => {
    marks_it_read()
  })

  /** A message written on the bond (MSG-2): from the field, which empties at once and takes its text back if it was not written; or «Invia di nuovo». */
  const writes = (text: string, from: 'the_field' | 'a_message_not_delivered'): void => {
    if (written.peek() === 'writing' || text.trim() === '') return
    written.value = 'writing'
    if (from === 'the_field') props.text.value = ''
    // Her own message: the conversation goes to its newest end.
    if (the_messages.current !== null) the_messages.current.scrollTop = 0
    void invokes(props.door, {
      use_case: 'usecase/write_a_message',
      version: the_version,
      input: { bond: props.bond, text },
    }).then((answered) => {
      const is_written =
        answered.answered === 'an_event' && answered.event === 'the_message_is_written'
      written.value = is_written ? 'nothing' : 'not_written'
      if (!is_written && from === 'the_field' && props.text.peek() === '') props.text.value = text
    })
  }

  const it = chat.value
  const all = it.read === 'read' ? in_its_order(it.messages) : []
  const shown = all.slice(-a_page * pages.value)
  const offline_now = offline.value
  const text = props.text.value
  const blank = text.trim() === ''
  const content = (() => {
    switch (it.read) {
      case 'reading':
        return <p>{words.the_conversation.reading}</p>
      case 'not_read':
        return (
          <>
            <p>{words.the_conversation.not_read}</p>
            <button
              type="button"
              data-part="read-again"
              onClick={() => {
                chat.value = { read: 'reading' }
                again.value += 1
              }}
            >
              {words.the_conversation.read_again}
            </button>
          </>
        )
      case 'read':
        if (all.length === 0) return <p>{words.the_conversation.none}</p>
        return (
          <>
            {shown.length < all.length && (
              <button
                type="button"
                data-part="older"
                onClick={() => {
                  pages.value += 1
                }}
              >
                {words.the_conversation.older}
              </button>
            )}
            <ol aria-label={words.the_conversation.the_list}>
              {shown.map((message, at) => {
                const before = shown[at - 1]
                const day = the_day_key(message.at, props.phone)
                return (
                  <AMessage
                    key={message.message_id}
                    message={message}
                    day={
                      before === undefined || the_day_key(before.at, props.phone) !== day
                        ? the_day_in_words(message.at, props.phone)
                        : undefined
                    }
                    bond={props.bond}
                    opened={opened.value === message.message_id}
                    toggles={() => {
                      opened.value =
                        opened.peek() === message.message_id ? undefined : message.message_id
                    }}
                    offline={offline_now}
                    phone={props.phone}
                    sends_again={() => {
                      writes(message.text, 'a_message_not_delivered')
                    }}
                  />
                )
              })}
            </ol>
          </>
        )
    }
  })()
  return (
    <div class="the-chat" data-where="on_the_whole_screen" data-state={it.read}>
      <div
        data-part="messages"
        ref={the_messages}
        onScroll={(event) => {
          const messages = event.currentTarget
          if (shown.length < all.length && near_the_oldest(messages)) pages.value += 1
          marks_it_read()
        }}
      >
        <div data-part="all">{content}</div>
      </div>
      <form
        data-part="field"
        onSubmit={(event) => {
          event.preventDefault()
          writes(props.text.peek(), 'the_field')
          // The focus stays on the field after «Invia».
          the_field.current?.focus()
        }}
      >
        {offline_now && (
          <p data-part="note" data-state="no_network">
            {words.the_field.no_network}
          </p>
        )}
        <p data-part="note" data-state={written.value} role="status">
          {written.value === 'not_written' ? words.the_field.not_written : ''}
        </p>
        <label>
          <span data-part="for-a-screen-reader">{words.the_field.label}</span>
          <textarea
            ref={the_field}
            name="the_message"
            rows={1}
            maxLength={4_000}
            placeholder={words.the_field.label}
            value={text}
            onInput={(event) => {
              props.text.value = event.currentTarget.value
              if (written.peek() === 'not_written') written.value = 'nothing'
            }}
            onKeyDown={(event) => {
              // Ctrl or ⌘ and Enter send, on a keyboard; Enter alone is a new line, as on a phone.
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
        </label>
        <button
          type="submit"
          data-part="send"
          disabled={blank || written.value === 'writing'}
          // A tap on «Invia» leaves the focus on the field, the keyboard open.
          onMouseDown={(event) => {
            event.preventDefault()
          }}
        >
          <Glyph glyph="send" />
          <span data-part="for-a-screen-reader">{words.the_field.send}</span>
        </button>
      </form>
      <p data-part="for-a-screen-reader" role="status" aria-atomic="false">
        {told.value.map((one) => (
          <span key={one.key}>{`${one.said} `}</span>
        ))}
      </p>
    </div>
  )
}
