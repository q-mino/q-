// The screens of the phone, rendered with Solid (step 22; UI-1..UI-5, V2,
// ADP-7): the adapter of `ui`, imported by the phone's composition root
// only (`@q-mino/adapters-web/screens`), so that the node's other adapters
// load no DOM rendering.
export { TheScreens, type TheScreensWiring } from './the_screens.tsx'
export type { TheScreensTexts } from './texts.ts'
export type { AFrameToPlace, TheApp, TheCommonTexts, TheDevice, ThePointsTexts } from './the_app.ts'
export type { AContactTexts } from './a_contact.tsx'
export type { APageTexts } from './a_page.tsx'
export type { AnExtensionTexts } from './an_extension.tsx'
export type { AnInvitationTexts } from './an_invitation.tsx'
export type { MyContactsTexts } from './my_contacts.tsx'
export type { TheExtensionsTexts } from './the_extensions.tsx'
export type { TheFirstFaceTexts } from './the_first_face.tsx'
export type { TheHandshakeAtADistanceTexts } from './the_handshake_at_a_distance.tsx'
export type { TheHandshakeInPersonTexts } from './the_handshake_in_person.tsx'
export type { WhatHappenedTexts } from './what_happened.tsx'
export type { AFrameServed, AnEventOfALeaf, HerNode, HerTicket } from '../her_node/index.ts'
