// Field (WEB-27): what she writes, a text with its label over it, a hint
// under it, or what is wrong with it, which a screen reader says at once.
// What it holds is the screen's (UI-1): the field shows it and tells each
// key; or, with no value given, the form it is in reads it when she sends it
// (her reason to put a letter aside). Read only, it shows a text to copy
// (her link), selected when she touches it. [Q, C, 24 Nov 2026]

/** What a field tells under it: nothing, a hint, or what is wrong. */
export type WhatAFieldTells =
  | { readonly tells: 'nothing' }
  | { readonly tells: 'a_hint'; readonly text: string }
  | { readonly tells: 'a_fault'; readonly text: string }

/** What a field holds: the screen's value, told at each key; what the form reads when sent; a text to copy. */
export type WhatAFieldHolds =
  | {
      readonly holds: 'the_screens'
      readonly value: string
      readonly types: (value: string) => void
    }
  | { readonly holds: 'the_forms' }
  | { readonly holds: 'a_text_to_copy'; readonly value: string }

export const Field = (props: {
  label: string
  name: string
  holds: WhatAFieldHolds
  tells?: WhatAFieldTells
  /** The keyboard she gets: words, a link, a number. */
  keyboard?: 'text' | 'url' | 'numeric'
  autocomplete?: string
  /** The longest text it takes. */
  max_length?: number
}) => {
  const tells = props.tells ?? { tells: 'nothing' }
  const holds = props.holds
  return (
    <label class="field" data-state={tells.tells === 'a_fault' ? 'faulty' : 'fine'}>
      <span data-part="label">{props.label}</span>
      <input
        name={props.name}
        inputMode={props.keyboard ?? 'text'}
        autocomplete={props.autocomplete ?? 'off'}
        aria-invalid={tells.tells === 'a_fault'}
        maxLength={props.max_length}
        {...(holds.holds === 'the_screens'
          ? {
              value: holds.value,
              onInput: (event: { currentTarget: HTMLInputElement }) => {
                holds.types(event.currentTarget.value)
              },
            }
          : holds.holds === 'a_text_to_copy'
            ? {
                value: holds.value,
                readOnly: true,
                onFocus: (event: { currentTarget: HTMLInputElement }) => {
                  event.currentTarget.select()
                },
              }
            : {})}
      />
      {tells.tells === 'a_hint' && <small data-part="hint">{tells.text}</small>}
      {tells.tells === 'a_fault' && (
        <small data-part="fault" role="alert">
          {tells.text}
        </small>
      )}
    </label>
  )
}
