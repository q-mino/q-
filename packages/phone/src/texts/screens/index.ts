import type { TheScreensTexts } from '@q-mino/adapters-web/screens'
import { a_contact } from './a_contact.ts'
import { a_page } from './a_page.ts'
import { an_extension } from './an_extension.ts'
import { an_invitation } from './an_invitation.ts'
import { common } from './common.ts'
import { extensions } from './extensions.ts'
import { my_contacts } from './my_contacts.ts'
import { the_extensions } from './the_extensions.ts'
import { the_first_face } from './the_first_face.ts'
import { the_handshake_at_a_distance } from './the_handshake_at_a_distance.ts'
import { the_handshake_in_person } from './the_handshake_in_person.ts'
import { what_happened } from './what_happened.ts'

// The words of the screens in Italian, the first language (provisional, A to
// confirm: the words she reads, UI-5), one file per screen.
export const screens = {
  common,
  the_first_face,
  my_contacts,
  a_contact,
  the_handshake_in_person,
  the_handshake_at_a_distance,
  an_invitation,
  the_extensions,
  an_extension,
  a_page,
  what_happened,
  extensions,
} satisfies TheScreensTexts
