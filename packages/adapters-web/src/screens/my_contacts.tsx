// Her contacts, the home of stage 1 (UI-5): her bonds by the names she gives
// them, as introduced when it differs, whether they have her; none yet, the
// two handshakes; the menu, a popover over the screen (WEB-29); a word when
// something happened.

import * as my_contacts from '@q-mino/domains/ui/my_contacts/_dsl.ts'
import type * as my_contacts_value from '@q-mino/domains/ui/my_contacts/_value.ts'
import { Gesture, List, Menu, Row, Screen, type AGlyph } from '../design/index.ts'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { the_app } from './the_app.ts'

/** The words of her contacts (provisional, A to confirm). */
export interface MyContactsTexts {
  readonly title: string
  readonly none_yet: string
  readonly introduced_as: (name: string) => string
  readonly they_have_you: string
  readonly not_yet: string
  readonly the_menu: string
  readonly close_the_menu: string
  readonly the_entries: Readonly<Record<my_contacts_value.an_entry, string>>
  readonly something_happened: (held_letters: number, happened: number) => string
}

/** The glyph of each entry of the menu. */
const the_glyph_of: Readonly<Record<my_contacts_value.an_entry, AGlyph>> = {
  the_handshake_in_person: 'qr_code',
  the_handshake_at_a_distance: 'link',
  the_extensions: 'puzzle',
  what_happened: 'history',
  the_introduction: 'book_open',
  the_server: 'info',
}

export const MyContacts = (props: { texts: MyContactsTexts }) => {
  const app = the_app()
  const screen = a_screen<my_contacts_value.the_state, my_contacts_value.what_happens>(app, {
    at_the_start: my_contacts.at_the_start,
    after: my_contacts.after,
  })
  const given = what_it_is_given(
    app,
    screen.state,
    async (): Promise<my_contacts_value.what_it_is_given> => {
      const [contacts, held_letters, happened] = await Promise.all([
        app.node.her_contacts(),
        app.node.the_held_letters(),
        app.node.what_happened(),
      ])
      return {
        contacts: [...contacts],
        held_letters: held_letters.length,
        happened: happened.length,
      }
    },
  )
  const state = screen.state.value
  const read = given.value
  const it =
    state === undefined || read === undefined
      ? undefined
      : my_contacts.what_it_shows(state, read.given)
  const chooses = (entry: my_contacts_value.an_entry) => {
    screen.happens({ happens: 'she_chooses', entry })
  }
  const taps = (does: () => void) => ({ does: 'taps', taps: does }) as const
  return (
    <Screen
      title={props.texts.title}
      state={it?.contacts.are}
      back={
        it !== undefined && (
          <span data-part="the-menu">
            <Gesture
              kind="quiet"
              label={props.texts.the_menu}
              glyph="ellipsis_vertical"
              does={taps(() => {
                screen.happens({ happens: 'she_opens_the_menu' })
              })}
            />
          </span>
        )
      }
    >
      {it?.menu !== undefined && (
        <Menu
          label={props.texts.the_menu}
          closes={() => {
            screen.happens({ happens: 'she_closes_the_menu' })
          }}
        >
          {it.menu.map((entry) => (
            <Gesture
              key={entry}
              kind="quiet"
              label={props.texts.the_entries[entry]}
              glyph={the_glyph_of[entry]}
              does={taps(() => {
                chooses(entry)
              })}
            />
          ))}
          <Gesture
            kind="quiet"
            label={props.texts.close_the_menu}
            glyph="x"
            does={taps(() => {
              screen.happens({ happens: 'she_closes_the_menu' })
            })}
          />
        </Menu>
      )}
      {it?.something_happened !== undefined && (
        <Gesture
          kind="secondary"
          glyph="history"
          label={props.texts.something_happened(
            it.something_happened.held_letters,
            it.something_happened.happened,
          )}
          does={taps(() => {
            screen.happens({ happens: 'she_opens_what_happened' })
          })}
        />
      )}
      {it?.contacts.are === 'none_yet' && (
        <>
          <p>{props.texts.none_yet}</p>
          <div data-part="gestures">
            {it.contacts.ways.map((entry, at) => (
              <Gesture
                key={entry}
                kind={at === 0 ? 'primary' : 'secondary'}
                label={props.texts.the_entries[entry]}
                glyph={the_glyph_of[entry]}
                does={taps(() => {
                  chooses(entry)
                })}
              />
            ))}
          </div>
        </>
      )}
      {it?.contacts.are === 'some' && (
        <List label={props.texts.title}>
          {it.contacts.list.map((contact) => (
            <Row
              key={contact.bond}
              glyph="user"
              title={contact.name}
              detail={
                <>
                  {contact.introduced_as !== undefined && (
                    <span>{props.texts.introduced_as(contact.introduced_as)} </span>
                  )}
                  <span>
                    {contact.they_have_me ? props.texts.they_have_you : props.texts.not_yet}
                  </span>
                </>
              }
              opens={() => {
                screen.happens({ happens: 'she_opens_a_contact', bond: contact.bond })
              }}
            />
          ))}
        </List>
      )}
    </Screen>
  )
}
