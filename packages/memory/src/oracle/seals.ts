// The module of `seals` in q-'s oracle (TST-2, MBX-7): the state of
// `seals/safe`, its predicates and selections as functions of that state,
// its sources, its calculations and its writes, the meaning from the
// domain's `dsl` (DOM-5); and the domain's command and read ports over a
// cell (SEA-1..SEA-8). The calculations are computed over the primitives
// port the oracle is given (SEA-5, SEA-6): the safe's machine is the
// configurator's, a fake in the stories, libsodium from step 18.

import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/seals/safe/_registry.ts'
import type * as safe_fact from '@q-mino/domains/seals/safe/_fact.ts'
import type * as safe_predicate from '@q-mino/domains/seals/safe/_predicate.ts'
import type * as face_selections from '@q-mino/domains/seals/safe/_face_selection.ts'
import type * as face_calculations from '@q-mino/domains/seals/safe/_face_calculation.ts'
import type * as mailbox_key_selections from '@q-mino/domains/seals/safe/_mailbox_key_selection.ts'
import type { face_id, mailbox_key_id, seed_id } from '@q-mino/domains/seals/safe/_id.ts'
import type { face, mailbox_key, seed } from '@q-mino/domains/seals/safe/_value.ts'
import type * as safe_query from '@q-mino/domains/seals/safe/_query.ts'
import {
  a_face_is_there,
  a_mailbox_key_is_there,
  opened_with,
  the_face_is_being_made,
  the_mailbox_key_is_being_drawn,
  the_signature_of,
  type Primitives,
} from '@q-mino/domains/seals/safe/_dsl.ts'
import {
  a_content_signed_by_a_face,
  a_sealed_content_opened_by_a_face,
  draw_a_mailbox_key,
  keep_a_mailbox_key,
  keep_a_new_seed_and_its_face,
  make_a_face_from_a_new_seed,
  the_key_of_a_mailbox,
} from '@q-mino/domains/seals/safe/_usecase.ts'
import type { CommandCell, ReadCell } from './cell.ts'
import {
  after,
  algebra,
  execute,
  page,
  read,
  recorded,
  selection_operators,
  type Field,
  type Selection,
  type Source,
} from './interpreter.ts'

/** The node's safe: its seeds, its faces and its mailbox keys, by id (SEA-1). */
export interface SealsState {
  readonly seeds: ReadonlyMap<seed_id, seed>
  readonly faces: ReadonlyMap<face_id, face>
  readonly mailbox_keys: ReadonlyMap<mailbox_key_id, mailbox_key>
}

/** A safe that keeps nothing yet: a node before its first face. */
export const no_secret: SealsState = {
  seeds: new Map(),
  faces: new Map(),
  mailbox_keys: new Map(),
}

export const seals_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof safe_predicate>,
  (state: SealsState) => boolean
> = {
  'seals/safe/predicate/a_face_has_this_id': (p) => (state) =>
    a_face_is_there(state.faces.get(p.face_id)),
  'seals/safe/predicate/the_face_is_being_made': (p) => (state) =>
    the_face_is_being_made(state.faces.get(p.face_id)),
  'seals/safe/predicate/a_mailbox_key_has_this_id': (p) => (state) =>
    a_mailbox_key_is_there(state.mailbox_keys.get(p.mailbox_key_id)),
  'seals/safe/predicate/the_mailbox_key_is_being_drawn': (p) => (state) =>
    the_mailbox_key_is_being_drawn(state.mailbox_keys.get(p.mailbox_key_id)),
}

// The reads of the subject `seals/safe/selection/face`: a face in the safe.

export const face_selection: zz.Algebra<
  zz.SelectionsIn<typeof face_selections>,
  Selection<SealsState, face>
> = {
  ...selection_operators<SealsState, face>(),
  predicate: {
    'seals/safe/selection/face/the_face_has_this_id': (p) => () => (the_face) =>
      the_face.id === p.face_id,
    'seals/safe/selection/face/the_face_is_made': () => () => (the_face) =>
      the_face.status === 'made',
  },
}

// The reads of the subject `seals/safe/selection/mailbox_key`: a mailbox key in the safe.

export const mailbox_key_selection: zz.Algebra<
  zz.SelectionsIn<typeof mailbox_key_selections>,
  Selection<SealsState, mailbox_key>
> = {
  ...selection_operators<SealsState, mailbox_key>(),
  predicate: {
    'seals/safe/selection/mailbox_key/the_mailbox_key_has_this_id': (p) => () => (the_key) =>
      the_key.id === p.mailbox_key_id,
    'seals/safe/selection/mailbox_key/the_mailbox_key_is_drawn': () => () => (the_key) =>
      the_key.status === 'drawn',
  },
}

/**
 * The calculations over a face (SEA-6), with its private key, which never
 * leaves the safe: over the primitives port, by the domain's `dsl`. A face
 * being made has no key and calculates nothing; the queries select made
 * faces only.
 */
export const face_calculation = (
  primitives: Primitives,
): zz.CalculationFragments<
  zz.CalculationsIn<typeof face_calculations>,
  Field<SealsState, face>
> => ({
  'seals/safe/calculation/face/the_signature_of_a_content': (p) => () => (the_face) =>
    the_face.status === 'made'
      ? the_signature_of(primitives)(the_face.private_key, p.content)
      : undefined,
  'seals/safe/calculation/face/the_sealed_content_opened': (p) => () => (the_face) =>
    the_face.status === 'made'
      ? opened_with(primitives)(the_face.private_key, p.sealed_content)
      : undefined,
})

const the_faces: Source<SealsState, face> = (state) => [...state.faces.values()]

const the_mailbox_keys: Source<SealsState, mailbox_key> = (state) => [
  ...state.mailbox_keys.values(),
]

/** The fields a face gives out of the safe (SEA-6): its id and its public key. */
const a_face_of_mine = {
  id: () => (the_face: face) => the_face.id,
  public_key: () => (the_face: face) => the_face.public_key,
}

export const face_sources: {
  readonly a_content_signed_by_a_face: zz.QuerySource<
    zz.FieldsOf<typeof safe_query.a_content_signed_by_a_face>,
    Source<SealsState, face>,
    Field<SealsState, face>
  >
  readonly a_sealed_content_opened_by_a_face: zz.QuerySource<
    zz.FieldsOf<typeof safe_query.a_sealed_content_opened_by_a_face>,
    Source<SealsState, face>,
    Field<SealsState, face>
  >
} = {
  a_content_signed_by_a_face: { from: the_faces, fields: a_face_of_mine },
  a_sealed_content_opened_by_a_face: { from: the_faces, fields: a_face_of_mine },
}

export const mailbox_key_sources: {
  readonly the_key_of_a_mailbox: zz.QuerySource<
    zz.FieldsOf<typeof safe_query.the_key_of_a_mailbox>,
    Source<SealsState, mailbox_key>,
    Field<SealsState, mailbox_key>
  >
} = {
  the_key_of_a_mailbox: {
    from: the_mailbox_keys,
    fields: {
      id: () => (the_key) => the_key.id,
      collect_secret: () => (the_key) => the_key.collect_secret,
      deposit_address: () => (the_key) => the_key.deposit_address,
    },
  },
}

export const seals_writes: zz.FactWrites<
  zz.FactsIn<typeof safe_fact>,
  (state: SealsState) => Partial<SealsState>
> = {
  'seals/safe/fact/a_face_has_been_asked_for':
    ({ face_being_made }) =>
    (state) => ({ faces: new Map(state.faces).set(face_being_made.id, face_being_made) }),
  'seals/safe/fact/a_face_has_been_made_from_a_new_seed':
    ({ new_seed, made_face }) =>
    (state) => ({
      seeds: new Map(state.seeds).set(new_seed.id, new_seed),
      faces: new Map(state.faces).set(made_face.id, made_face),
    }),
  'seals/safe/fact/a_mailbox_key_has_been_asked_for':
    ({ mailbox_key_being_drawn }) =>
    (state) => ({
      mailbox_keys: new Map(state.mailbox_keys).set(
        mailbox_key_being_drawn.id,
        mailbox_key_being_drawn,
      ),
    }),
  'seals/safe/fact/a_mailbox_key_has_been_drawn':
    ({ drawn_mailbox_key }) =>
    (state) => ({
      mailbox_keys: new Map(state.mailbox_keys).set(drawn_mailbox_key.id, drawn_mailbox_key),
    }),
}

/** The command use cases of `safe`, whose ports the oracle builds: reached by reactions and the executor (PER-21). */
export const seals_command_use_cases = {
  make_a_face_from_a_new_seed,
  keep_a_new_seed_and_its_face,
  draw_a_mailbox_key,
  keep_a_mailbox_key,
}

/** The oracle's state adapter for the commands of `safe` (TST-2): fragments, writes, the execution. */
export const seals_command_adapter = (cell: CommandCell<SealsState>) => ({
  algebra: algebra<SealsState, typeof seals_fragments>(seals_fragments),
  write: seals_writes,
  execute: execute(cell),
  recorded: recorded(cell),
})

/**
 * The ports of `seals/safe` over the oracle (TST-2): its commands, and its
 * reads, by subject, a face's over the primitives port. No read streams:
 * a signature, an opening and a mailbox's key are asked when needed (SEA-6).
 */
export const seals_ports =
  (cell: CommandCell<SealsState> & ReadCell<SealsState>, primitives: Primitives) =>
  (versions: zz.Versions) => ({
    ...zz.command_use_case_ports({
      registry,
      versions,
      use_cases: seals_command_use_cases,
    })(seals_command_adapter(cell)),
    ...zz.read_use_case_ports({
      registry,
      versions,
      use_cases: { a_content_signed_by_a_face, a_sealed_content_opened_by_a_face },
    })({
      algebra: { ...face_selection, after },
      sources: face_sources,
      calculations: face_calculation(primitives),
      read: read(cell),
      page: page(cell),
      streams: {},
    }),
    ...zz.read_use_case_ports({
      registry,
      versions,
      use_cases: { the_key_of_a_mailbox },
    })({
      algebra: { ...mailbox_key_selection, after },
      sources: mailbox_key_sources,
      read: read(cell),
      page: page(cell),
      streams: {},
    }),
  })

/** The safe's ports (`seals/safe`), by name (WEB-16, CFG-5): what a phone's storage gives of it, the oracle's or another, its type written once. */
export interface TheSafesPorts extends ReturnType<ReturnType<typeof seals_ports>> {}
