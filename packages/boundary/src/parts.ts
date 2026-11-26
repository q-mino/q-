import type * as z from 'zod'
import type { an_event } from './messages.ts'
import type { a_place_with_its_data } from './places.ts'
import type { Json } from './values.ts'

// A part of an extension's, integrated (EXT-16, K-3; WEB-23): a component of
// the extension's own, drawn by the kernel in its mark of the extension, at
// a place of its screens. Its module is the one its point names (`shows`,
// `parts/<name>.js`), the package's export of that subpath; its export
// `part`, a function component of the rendering library the extension's
// `parts/` may import (Preact, GR-10), given what it is told. A client of its
// own extension's surface on `self` only, through its door to the kernel:
// each invocation and each follow is a message of a part's (EXT-2,
// `a_message_from_a_part`), fenced by the kernel (EXT-4), its events back in
// order. No type of the rendering library here: the boundary imports zod
// only (GR-10), and a component is a function of what it is told.
// [Q, C, high impact: A to discuss] (26–27 Nov 2026, part M4 of messaging)

/** Where a part is drawn (EXT-16, WEB-30): in its place (a slot in its screen, compact on a row), or on the whole screen (a slot at her tap, a page). */
export type WhereAPartIs = 'in_its_place' | 'on_the_whole_screen'

/** What a part asks of its door: a leaf of its extension's on `self`, by its path in the surface (`usecase/write_a_message`), the version it speaks, and its input. */
export interface WhatAPartAsks {
  readonly use_case: string
  readonly version: string
  readonly input: Json
}

/**
 * What a part is told of what it asked, in order (EXT-2): each event of the
 * leaf's flow, as the boundary carries it, which the part parses by its own
 * surface (EXT-15); or that the kernel did not serve it, last, and why: its
 * fence refused it (EXT-4: the extension no longer active, the part no
 * longer shown), or the extension cannot be reached (not running, fallen),
 * which the kernel tells in its mark and in what happened (USR-8). The flow
 * ends after its last event (`done`).
 */
export type WhatAPartIsTold =
  | { readonly told: 'an_event'; readonly event: z.output<typeof an_event> }
  | {
      readonly told: 'not_served'
      readonly because: 'the_kernels_fence' | 'the_extension_cannot_be_reached'
    }

/**
 * A part's door to the kernel (EXT-16, EXT-4): an invocation of a leaf (a
 * command, or a read once), its flow until it ends; a read it follows, its
 * snapshot then each change, until the part stops it (`break`, `return()`)
 * or the kernel ends it once the part is no longer shown (K-4: the kernel
 * stops reading at once and ends the flow in the extension). Each call one
 * exchange, its id the kernel's.
 */
export interface APartsDoor {
  readonly invoke: (asked: WhatAPartAsks) => AsyncIterable<WhatAPartIsTold>
  readonly follow: (asked: WhatAPartAsks) => AsyncIterable<WhatAPartIsTold>
}

/**
 * What a part is told when the kernel draws it (EXT-16, EXT-2's `placed`):
 * its place with the place's data, its subject (on a bond, the bond, never
 * its name: the kernel's screen around names the contact); where it is
 * drawn; whether its screen is the one shown (a part on a screen under
 * another is not, and its follows are ended: it follows again once shown);
 * and its door.
 */
export interface WhatAPartIsGiven {
  readonly placed: a_place_with_its_data
  readonly where: WhereAPartIs
  readonly shown: boolean
  readonly door: APartsDoor
}
