// Her contacts, the home of stage 1 (UI-5): her bonds by the names she gives
// them, as introduced when it differs, whether they have her; none yet, the
// two handshakes; the menu; a word when something happened.

import * as my_contacts from '@q-mino/domains/ui/my_contacts/_dsl.ts'
import type * as my_contacts_value from '@q-mino/domains/ui/my_contacts/_value.ts'
import { For, Match, Show, Switch } from 'solid-js'
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
  const shown = () => {
    const state = screen.state()
    const read = given()
    return state === undefined || read === undefined
      ? undefined
      : my_contacts.what_it_shows(state, read.given)
  }
  const none_yet = () => {
    const contacts = shown()?.contacts
    return contacts?.are === 'none_yet' ? contacts : undefined
  }
  const some = () => {
    const contacts = shown()?.contacts
    return contacts?.are === 'some' ? contacts : undefined
  }
  const chooses = (entry: my_contacts_value.an_entry) => {
    screen.happens({ happens: 'she_chooses', entry })
  }
  return (
    <section aria-label={props.texts.title}>
      <h1>{props.texts.title}</h1>
      <Show when={shown()}>
        {(it) => (
          <>
            <Show
              when={it().menu}
              fallback={
                <button
                  type="button"
                  onClick={() => {
                    screen.happens({ happens: 'she_opens_the_menu' })
                  }}
                >
                  {props.texts.the_menu}
                </button>
              }
            >
              {(menu) => (
                <nav aria-label={props.texts.the_menu}>
                  <For each={menu()}>
                    {(entry) => (
                      <button
                        type="button"
                        onClick={() => {
                          chooses(entry)
                        }}
                      >
                        {props.texts.the_entries[entry]}
                      </button>
                    )}
                  </For>
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
            </Show>
            <Show when={it().something_happened}>
              {(something) => (
                <button
                  type="button"
                  onClick={() => {
                    screen.happens({ happens: 'she_opens_what_happened' })
                  }}
                >
                  {props.texts.something_happened(something().held_letters, something().happened)}
                </button>
              )}
            </Show>
            <Switch>
              <Match when={none_yet()}>
                {(none) => (
                  <>
                    <p>{props.texts.none_yet}</p>
                    <For each={none().ways}>
                      {(entry) => (
                        <button
                          type="button"
                          onClick={() => {
                            chooses(entry)
                          }}
                        >
                          {props.texts.the_entries[entry]}
                        </button>
                      )}
                    </For>
                  </>
                )}
              </Match>
              <Match when={some()}>
                {(contacts) => (
                  <ul>
                    <For each={contacts().list}>
                      {(contact) => (
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              screen.happens({ happens: 'she_opens_a_contact', bond: contact.bond })
                            }}
                          >
                            {contact.name}
                          </button>
                          <Show when={contact.introduced_as}>
                            {(introduced) => (
                              <small> {props.texts.introduced_as(introduced())}</small>
                            )}
                          </Show>
                          <small>
                            {' '}
                            {contact.they_have_me ? props.texts.they_have_you : props.texts.not_yet}
                          </small>
                        </li>
                      )}
                    </For>
                  </ul>
                )}
              </Match>
            </Switch>
          </>
        )}
      </Show>
    </section>
  )
}
