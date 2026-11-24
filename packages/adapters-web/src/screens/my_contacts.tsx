// Her contacts, the home of stage 1 (UI-5): her bonds by the names she gives
// them, as introduced when it differs, whether they have her; none yet, the
// two handshakes; the menu; a word when something happened.

import * as my_contacts from '@q-mino/domains/ui/my_contacts/_dsl.ts'
import type * as my_contacts_value from '@q-mino/domains/ui/my_contacts/_value.ts'
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
  return (
    <section aria-label={props.texts.title} data-state={it?.contacts.are}>
      <h1>{props.texts.title}</h1>
      {it !== undefined && (
        <>
          {it.menu === undefined ? (
            <button
              type="button"
              onClick={() => {
                screen.happens({ happens: 'she_opens_the_menu' })
              }}
            >
              {props.texts.the_menu}
            </button>
          ) : (
            <nav aria-label={props.texts.the_menu}>
              {it.menu.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => {
                    chooses(entry)
                  }}
                >
                  {props.texts.the_entries[entry]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  screen.happens({ happens: 'she_closes_the_menu' })
                }}
              >
                {props.texts.close_the_menu}
              </button>
            </nav>
          )}
          {it.something_happened !== undefined && (
            <button
              type="button"
              onClick={() => {
                screen.happens({ happens: 'she_opens_what_happened' })
              }}
            >
              {props.texts.something_happened(
                it.something_happened.held_letters,
                it.something_happened.happened,
              )}
            </button>
          )}
          {it.contacts.are === 'none_yet' && (
            <>
              <p>{props.texts.none_yet}</p>
              {it.contacts.ways.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => {
                    chooses(entry)
                  }}
                >
                  {props.texts.the_entries[entry]}
                </button>
              ))}
            </>
          )}
          {it.contacts.are === 'some' && (
            <ul>
              {it.contacts.list.map((contact) => (
                <li key={contact.bond}>
                  <button
                    type="button"
                    onClick={() => {
                      screen.happens({ happens: 'she_opens_a_contact', bond: contact.bond })
                    }}
                  >
                    {contact.name}
                  </button>
                  {contact.introduced_as !== undefined && (
                    <small> {props.texts.introduced_as(contact.introduced_as)}</small>
                  )}
                  <small>
                    {' '}
                    {contact.they_have_me ? props.texts.they_have_you : props.texts.not_yet}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
