// The words the screens show, by screen (provisional, A to confirm: the
// words she reads, UI-5): the shape a language gives, which the phone's
// texts fill (`packages/phone/src/texts/`), Italian first.

import type { AContactTexts } from './a_contact.tsx'
import type { APageTexts } from './a_page.tsx'
import type { AnExtensionTexts } from './an_extension.tsx'
import type { AnInvitationTexts } from './an_invitation.tsx'
import type { MyContactsTexts } from './my_contacts.tsx'
import type { TheCommonTexts } from './the_app.ts'
import type { TheExtensionsTexts } from './the_extensions.tsx'
import type { TheFirstFaceTexts } from './the_first_face.tsx'
import type { TheHandshakeAtADistanceTexts } from './the_handshake_at_a_distance.tsx'
import type { TheHandshakeInPersonTexts } from './the_handshake_in_person.tsx'
import type { WhatHappenedTexts } from './what_happened.tsx'

/** The words of the screens, in one language. */
export interface TheScreensTexts {
  readonly common: TheCommonTexts
  readonly the_first_face: TheFirstFaceTexts
  readonly my_contacts: MyContactsTexts
  readonly a_contact: AContactTexts
  readonly the_handshake_in_person: TheHandshakeInPersonTexts
  readonly the_handshake_at_a_distance: TheHandshakeAtADistanceTexts
  readonly an_invitation: AnInvitationTexts
  readonly the_extensions: TheExtensionsTexts
  readonly an_extension: AnExtensionTexts
  readonly a_page: APageTexts
  readonly what_happened: WhatHappenedTexts
}
