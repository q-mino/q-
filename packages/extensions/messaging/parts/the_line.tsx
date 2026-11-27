import { useSignal } from '@preact/signals'
import type * as boundary from '@q-mino/boundary'
import { useEffect } from 'preact/hooks'
import { the_words_of_the_chat as words } from '../texts/it.ts'
import { Glyph, the_glyph_of } from './glyphs.tsx'
import { when_in_a_line } from './in_words.ts'
import type { ThePhoneOfTheChat } from './the_phone.ts'
import { a_glance_after, follows, the_version, type a_glance_read } from './what_it_reads.ts'

// The chat in its place (MSG-7, MSG-15; part M5): a line, on a contact's
// row in her contacts and under the slot's head on a contact's screen. It
// follows `a_chat_at_a_glance` while it is shown (EXT-16, K-4), again each
// time it is shown again (G-2: what it read is told anew), and tells the
// chat's last message, its first words, hers with where it stands, theirs
// with how many are to read («2 da leggere»), and when. It holds no gesture
// of its own: on a row the whole slot is the gesture to the whole screen
// (MSG-15), on a contact's screen the slot's head.

export const TheLine = (props: {
  bond: string
  door: boundary.APartsDoor
  shown: boolean
  phone: ThePhoneOfTheChat
}) => {
  const glance = useSignal<a_glance_read>({ read: 'reading' })
  const again = useSignal(0)
  const reads = again.value
  useEffect(() => {
    if (!props.shown) return
    return follows(
      props.door,
      { use_case: 'usecase/a_chat_at_a_glance', version: the_version, input: { bond: props.bond } },
      (told) => {
        const after = a_glance_after(glance.peek(), told)
        glance.value = after.glance
        if (after.then === 'reads_again') again.value += 1
      },
    )
  }, [props.shown, props.bond, reads])
  const it = glance.value
  switch (it.read) {
    case 'reading':
      return <p class="the-chat" data-where="in_its_place" data-state="reading" />
    case 'none':
      return (
        <p class="the-chat" data-where="in_its_place" data-state="none">
          <span data-part="last">{words.the_line.none}</span>
        </p>
      )
    case 'not_read':
      return (
        <p class="the-chat" data-where="in_its_place" data-state="not_read">
          <span data-part="last">{words.the_line.not_read}</span>
        </p>
      )
    case 'read': {
      const last = it.glance.the_last_message
      const when = when_in_a_line(last.at, props.phone)
      return (
        <p
          class="the-chat"
          data-where="in_its_place"
          data-state="read"
          data-to-read={it.glance.to_read > 0 ? 'some' : 'none'}
        >
          <span data-part="last">
            {last.whose.whose === 'mine' && <span data-part="who">{words.the_line.mine} </span>}
            {last.text}
          </span>{' '}
          <span data-part="side">
            {last.whose.whose === 'mine' && (
              <>
                <span data-part="stage" data-state={last.whose.stage.stage}>
                  <Glyph glyph={the_glyph_of(last.whose.stage)} />
                  {words.the_stages_in_a_line[last.whose.stage.stage]}
                </span>{' '}
              </>
            )}
            {it.glance.to_read > 0 && (
              <>
                <span data-part="to-read">{words.the_line.to_read(it.glance.to_read)}</span>{' '}
              </>
            )}
            <time dateTime={last.at}>{when}</time>
          </span>
        </p>
      )
    }
  }
}
