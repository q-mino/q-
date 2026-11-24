// The files of stories the gallery shows (WEB-28), in its order: the
// tokens, then each component of the design (WEB-27).

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

export const the_files = [tokens, icon, gesture, notice, flaw, strip, list, field, screen].map(
  the_file_of,
)
