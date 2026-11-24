// Icon (WEB-27): every glyph, by its name; one named, as a screen reader hears it.

import { Icon, the_glyphs, type AGlyph } from '@q-mino/adapters-web/design'

const the_names = Object.keys(the_glyphs).filter((name): name is AGlyph => name in the_glyphs)

export default { title: 'Design/Icon', component: Icon }

export const every_glyph = {
  render: () => (
    <ul class="gallery-swatches">
      {the_names.map((name) => (
        <li key={name} class="gallery-row">
          <Icon glyph={name} />
          <code>{name}</code>
        </li>
      ))}
    </ul>
  ),
}

export const a_glyph_named = {
  render: () => (
    <p class="gallery-row">
      <Icon glyph="wifi_off" named="Senza rete" />
    </p>
  ),
}
