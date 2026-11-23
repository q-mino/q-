// Her node, as the screens see it (UI-1, UI-3, USR-9, ADP-7): what they read
// of it, in their words (GR-3's form: `user`'s and `self`'s reads linked to
// `ui`'s values), what a gesture asks of it, and when it may have changed,
// so that the screens read it again. The rendering (`screens/`) takes it;
// the phone's composition root gives it over the node's ports (step 25),
// the tests a node of their own. Since part 22.2 a frame reaches it too,
// through the kernel's fence (EXT-4, EXT-16, WEB-23): what the fence serves
// it asks of her node, what it refuses goes to the kernel's trace.

import type { Fenced, TheKernelsTraced } from '@q-mino/adapters-common'
import type * as ui_value from '@q-mino/domains/ui/_value.ts'
import type * as user_value from '@q-mino/domains/user/_value.ts'
import type * as activities_value from '@q-mino/domains/user/activities/_value.ts'

/** A ticket of hers, ready (`my_ticket`, with its secret: the ticket shown, BND-8), and its link (WEB-1), which its QR draws (WEB-2). */
export interface HerTicket {
  readonly ready: ui_value.a_ticket_ready
  readonly link: string
}

/** A frame's message the kernel's fence served (EXT-4): an invocation, or a read it follows, of its own extension's leaf on `self`, with the name the kernel added. */
export type AFrameServed = Extract<Fenced, { readonly fenced: 'served' }>

/** An event of a leaf's flow, as her node gives it: a JSON object named by `event` (EXT-2). */
export type AnEventOfALeaf = { readonly event: string } & Readonly<Record<string, unknown>>

/** The relay her letters go through, as the screens show it (UI-5): its address, the configuration's, and how her node last met it. */
export interface TheRelaySeen {
  readonly address: string
  readonly met: ui_value.the_relay_met
}

/** Her node, as the screens read it and ask of it. */
export interface HerNode {
  /** Her faces (`my_faces`). */
  readonly her_faces: () => Promise<readonly ui_value.a_face_seen[]>
  /** The face she acts as, none before she chose one (USR-6). */
  readonly the_active_face: () => Promise<string | undefined>
  /** Her contacts (`my_bonds`). */
  readonly her_contacts: () => Promise<readonly ui_value.a_contact_seen[]>
  /** A contact's card (`a_bond`), none once removed. */
  readonly a_contact: (bond: string) => Promise<ui_value.a_contact_card | undefined>
  /** Her ticket for a bond to be, once ready. */
  readonly her_ticket: (bond: string) => Promise<HerTicket | undefined>
  /** The extensions installed, each as the screens show it (the composition's, with `an_extension`). */
  readonly the_extensions: () => Promise<readonly ui_value.an_extension_seen[]>
  /** The bonds each extension is offered to (EXT-7). */
  readonly the_offers: () => Promise<ui_value.the_offers>
  /** What came back of the last question she asked a bond about the extensions in common (`the_questions_asked_of_a_bond`, UI-5). */
  readonly the_extensions_in_common_with: (
    bond: string,
  ) => Promise<ui_value.the_extensions_in_common>
  /** The relay her letters go through, and how her node last met it (UI-5: the server's screen, the strip). */
  readonly the_relay: () => Promise<TheRelaySeen>
  /** The device's network, as her phone tells it (UI-5's strip: no network told apart from a relay silent). */
  readonly the_network: () => Promise<ui_value.the_device_s_network>
  /** What her node offers a bond, with the majors it speaks (`the_extensions_offered_to_a_bond`, EXT-8). */
  readonly offered_to: (bond: string) => Promise<activities_value.offered>
  /** An activity, as `user` reads it. */
  readonly an_activity: (activity_id: string) => Promise<activities_value.activity_card | undefined>
  /** The activities in progress, in the order she asked them. */
  readonly the_activities_in_progress: () => Promise<readonly activities_value.activity_card[]>
  /** The draft for this, if one is kept (USR-5). */
  readonly a_draft: (purpose: ui_value.a_draft_for) => Promise<string | undefined>
  /** The letters held, as she is told them (USR-8). */
  readonly the_held_letters: () => Promise<readonly user_value.a_held_letter[]>
  /** What happened without a fact, as she is told it (USR-8). */
  readonly what_happened: () => Promise<readonly user_value.what_happened_without_a_fact[]>
  /** What a gesture asks (UI-3), handed to the use case of `user` of its name; resolved once `user` has it. */
  readonly asks: (what: ui_value.what_it_asks) => Promise<void>
  /** What a frame asks, as the fence served it (EXT-16, WEB-23): its extension's leaf on `self`, invoked or followed, its events in order until its flow ends or the frame stops it. */
  readonly a_frame_asks: (served: AFrameServed) => AsyncIterable<AnEventOfALeaf>
  /** A frame's message the fence refused (`a_frame_fenced`), to the kernel's trace (EXT-4, F6). */
  readonly a_frame_is_fenced: (traced: TheKernelsTraced) => void
  /** Tell each time her node may have changed (a fact recorded, a letter held, a trace written); the function returned stops telling. */
  readonly when_it_changes: (tell: () => void) => () => void
}
