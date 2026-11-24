// The tokens (WEB-26): every colour by its name, the type, the spaces.
// The swatches are drawn with the token they show, by name.

import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples.the_tokens

const the_colours = [
  'paper',
  'paper-raised',
  'paper-sunken',
  'ink',
  'ink-soft',
  'roan-line',
  'roan-edge',
  'cumin',
  'on-cumin',
  'cumin-ink',
  'danger',
  'fault',
  'waiting',
  'focus',
] as const

const the_texts = ['text-s', 'text-m', 'text-l', 'text-xl'] as const
const the_spaces = ['space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6'] as const

export default { title: 'Design/Tokens', component: undefined }

export const the_colours_of_the_theme = {
  render: () => (
    <section aria-label={words.colours}>
      <ul class="gallery-swatches">
        {the_colours.map((name) => (
          <li key={name}>
            <span data-part="swatch" style={{ background: `var(--${name})` }} />
            <code>--{name}</code>
          </li>
        ))}
      </ul>
    </section>
  ),
}

export const the_type = {
  render: () => (
    <section aria-label={words.type}>
      {the_texts.map((name) => (
        <p key={name} style={{ fontSize: `var(--${name})` }}>
          <code>--{name}</code> {words.a_sentence}
        </p>
      ))}
    </section>
  ),
}

export const the_spaces_between = {
  render: () => (
    <section aria-label={words.spaces}>
      {the_spaces.map((name) => (
        <p key={name} class="gallery-row">
          <span
            style={{
              inlineSize: `var(--${name})`,
              blockSize: '1rem',
              background: 'var(--cumin)',
            }}
          />
          <code>--{name}</code>
        </p>
      ))}
    </section>
  ),
}
