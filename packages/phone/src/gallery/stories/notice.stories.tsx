// Notice (WEB-27): each kind it tells.

import { Notice } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples

export default { title: 'Design/Notice', component: Notice }

export const information = {
  render: () => <Notice kind="information">{words.no_answer}</Notice>,
}

export const waiting = {
  render: () => <Notice kind="waiting">{words.waiting}</Notice>,
}

export const done = {
  render: () => <Notice kind="done">{words.done}</Notice>,
}

export const a_fault = {
  render: () => <Notice kind="fault">{words.something_went_wrong}</Notice>,
}
