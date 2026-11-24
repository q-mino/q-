// Field (WEB-27): empty, written, with a hint, with what is wrong.

import { Field } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples
const nothing = () => undefined

export default { title: 'Design/Field', component: Field }

export const empty = {
  render: () => (
    <Field
      label={words.your_name}
      name="name"
      holds={{ holds: 'the_screens', value: '', types: nothing }}
    />
  ),
}

export const written = {
  render: () => (
    <Field
      label={words.your_name}
      name="name"
      holds={{ holds: 'the_screens', value: 'Anna', types: nothing }}
    />
  ),
}

export const with_a_hint = {
  render: () => (
    <Field
      label={words.your_name}
      name="name"
      holds={{ holds: 'the_screens', value: '', types: nothing }}
      tells={{ tells: 'a_hint', text: words.a_name_hint }}
    />
  ),
}

export const with_a_fault = {
  render: () => (
    <Field
      label={words.your_name}
      name="name"
      holds={{ holds: 'the_screens', value: ' ', types: nothing }}
      tells={{ tells: 'a_fault', text: words.a_name_fault }}
    />
  ),
}
