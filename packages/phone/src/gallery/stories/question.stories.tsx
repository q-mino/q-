// Question (WEB-27): a confirmation, which holds the screen (alone in the
// gallery's page, WEB-28), and a proposal, which stands beside it.

import { Gesture, Question } from '@q-mino/adapters-web/design'
import { the_gallery } from '../../texts/index.ts'

const words = the_gallery.samples
const taps = { does: 'taps', taps: () => undefined } as const

export default { title: 'Design/Question', component: Question }

export const a_confirmation = {
  render: () => (
    <Question
      kind="confirmation"
      title={words.remove_it}
      declines={() => undefined}
      answers={
        <>
          <Gesture kind="secondary" label={words.stop_renaming} does={taps} />
          <Gesture kind="dangerous" label={words.remove_it} does={taps} />
        </>
      }
    >
      <p>{words.the_storage}</p>
    </Question>
  ),
}

export const a_proposal = {
  render: () => (
    <Question
      kind="proposal"
      title={words.done}
      declines={() => undefined}
      answers={<Gesture kind="primary" label={words.give_the_name} does={taps} />}
    >
      <p>{words.the_storage}</p>
    </Question>
  ),
}
