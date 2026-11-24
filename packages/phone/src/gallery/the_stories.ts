// The files of stories the gallery shows (WEB-28), in its order: the
// tokens, then each component of the design (WEB-27), then each screen
// (WEB-29).

import { the_file_of } from './a_story.ts'
import * as field from './stories/field.stories.tsx'
import * as flaw from './stories/flaw.stories.tsx'
import * as gesture from './stories/gesture.stories.tsx'
import * as icon from './stories/icon.stories.tsx'
import * as list from './stories/list.stories.tsx'
import * as notice from './stories/notice.stories.tsx'
import * as screen from './stories/screen.stories.tsx'
import * as strip from './stories/strip.stories.tsx'
import * as tokens from './stories/tokens.stories.tsx'
import * as my_contacts from './stories/screens/my_contacts.stories.tsx'

/** The screens (WEB-29), after the components. */
const the_screens = [my_contacts]

export const the_files = [
  tokens,
  icon,
  gesture,
  notice,
  flaw,
  strip,
  list,
  field,
  screen,
  ...the_screens,
].map(the_file_of)
