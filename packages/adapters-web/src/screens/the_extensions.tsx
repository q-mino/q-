// The extensions installed (UI-5; EXT-7, EXT-10): each by its name, with its
// version and whether it is active, not active, or waiting for her to
// accept a new manifest; each opens its own screen.

import * as the_extensions from '@q-mino/domains/ui/the_extensions/_dsl.ts'
import type * as the_extensions_value from '@q-mino/domains/ui/the_extensions/_value.ts'
import { createMemo, For, Show } from 'solid-js'
import { a_screen, what_it_is_given } from './a_screen.ts'
import { Back } from './parts.tsx'
import { the_app } from './the_app.ts'

/** The words of the extensions installed (provisional, A to confirm). */
export interface TheExtensionsTexts {
  readonly title: string
  readonly none: string
  readonly the_version: (version: string) => string
  /** Its state, by its case. */
  readonly is: Readonly<Record<the_extensions_value.an_extension_in_the_list['is'], string>>
}

export const TheExtensions = (props: { texts: TheExtensionsTexts }) => {
  const app = the_app()
  const screen = a_screen<the_extensions_value.the_state, the_extensions_value.what_happens>(app, {
    at_the_start: the_extensions.at_the_start,
    after: the_extensions.after,
  })
  const given = what_it_is_given(app, screen.state, () => app.node.the_extensions())
  const shown = createMemo(() => {
    const state = screen.state()
    const read = given()
    return state === undefined || read === undefined
      ? undefined
      : the_extensions.what_it_shows(state, read.given)
  })
  return (
    <section aria-label={props.texts.title}>
      <Back
        onBack={() => {
          screen.happens({ happens: 'she_goes_back' })
        }}
      />
      <h1>{props.texts.title}</h1>
      <Show when={shown()}>
        {(it) => (
          <Show when={it().extensions.length > 0} fallback={<p>{props.texts.none}</p>}>
            <ul>
              <For each={it().extensions}>
                {(one) => (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        screen.happens({
                          happens: 'she_opens_an_extension',
                          extension: one.extension,
                        })
                      }}
                    >
                      {one.extension}
                    </button>{' '}
                    <small>{props.texts.the_version(one.version)}</small>{' '}
                    <small>{props.texts.is[one.is]}</small>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        )}
      </Show>
    </section>
  )
}
