// Field (WEB-27): what she writes, a text with its label over it, a hint
// under it, or what is wrong with it, which a screen reader says at once.
// What it holds is the screen's (UI-1): the field shows it and tells each
// key. [Q, C, 24 Nov 2026]

/** What a field tells under it: nothing, a hint, or what is wrong. */
export type WhatAFieldTells =
  | { readonly tells: 'nothing' }
  | { readonly tells: 'a_hint'; readonly text: string }
  | { readonly tells: 'a_fault'; readonly text: string }

export const Field = (props: {
  label: string
  name: string
  value: string
  types: (value: string) => void
  tells?: WhatAFieldTells
  /** The keyboard she gets: words, a link, a number. */
  keyboard?: 'text' | 'url' | 'numeric'
  autocomplete?: string
}) => {
  const tells = props.tells ?? { tells: 'nothing' }
  return (
    <label class="field" data-state={tells.tells === 'a_fault' ? 'faulty' : 'fine'}>
      <span data-part="label">{props.label}</span>
      <input
        name={props.name}
        value={props.value}
        inputMode={props.keyboard ?? 'text'}
        autocomplete={props.autocomplete ?? 'off'}
        aria-invalid={tells.tells === 'a_fault'}
        onInput={(event) => {
          props.types(event.currentTarget.value)
        }}
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
