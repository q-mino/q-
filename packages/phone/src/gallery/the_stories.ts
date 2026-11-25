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
import * as card from './stories/card.stories.tsx'
import * as menu from './stories/menu.stories.tsx'
import * as question from './stories/question.stories.tsx'
import * as qr from './stories/qr.stories.tsx'
import * as why from './stories/why.stories.tsx'
import * as mark from './stories/mark.stories.tsx'
import * as slot from './stories/slot.stories.tsx'
import * as the_app from './stories/screens/the_app.stories.tsx'
import * as the_first_face from './stories/screens/the_first_face.stories.tsx'
import * as the_server from './stories/screens/the_server.stories.tsx'
import * as the_introduction from './stories/screens/the_introduction.stories.tsx'
import * as my_contacts from './stories/screens/my_contacts.stories.tsx'
import * as a_contact from './stories/screens/a_contact.stories.tsx'
import * as the_handshake_in_person from './stories/screens/the_handshake_in_person.stories.tsx'
import * as the_handshake_at_a_distance from './stories/screens/the_handshake_at_a_distance.stories.tsx'
import * as an_invitation from './stories/screens/an_invitation.stories.tsx'
import * as the_extensions from './stories/screens/the_extensions.stories.tsx'
import * as an_extension from './stories/screens/an_extension.stories.tsx'
import * as a_page from './stories/screens/a_page.stories.tsx'
import * as what_happened from './stories/screens/what_happened.stories.tsx'
import * as the_strip from './stories/screens/the_strip.stories.tsx'

/** The screens (WEB-29), after the components. */
const the_screens = [
  the_app,
  the_first_face,
  the_introduction,
  the_server,
  my_contacts,
  a_contact,
  the_handshake_in_person,
  the_handshake_at_a_distance,
  an_invitation,
  the_extensions,
  an_extension,
  a_page,
  what_happened,
  the_strip,
]

export const the_files = [
  tokens,
  icon,
  gesture,
  notice,
  flaw,
  strip,
  list,
  field,
  card,
  menu,
  question,
  qr,
  why,
  mark,
  slot,
  screen,
  ...the_screens,
].map(the_file_of)
