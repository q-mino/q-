// The module of `seals` on the node's database (IndexedDB, SQLite) (WEB-8, WEB-9, part 21.2): the oracle's
// (TST-2) over the store of `seals/safe`. Each map of the oracle's state is
// a kind of record, by its id: a seed under `['state', 'seed', seed_id]`, a
// face under `['state', 'face', face_id]`, a mailbox key under
// `['state', 'mailbox_key', mailbox_key_id]`, each parsed with the domain's
// schema when read. Its predicates' fragments read the record they name,
// its facts' writes put the values their facts carry, whole, as the oracle's
// do; its sources read every record of a kind and select in memory (WEB-8).
// The meanings from the domain's `dsl` (DOM-5); the calculations over the
// primitives port the configurator gives (SEA-5, SEA-6).

import type { TheSafesPorts } from '../../ports/index.ts'
import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/seals/safe/_registry.ts'
import type * as safe_fact from '@q-mino/domains/seals/safe/_fact.ts'
import type * as safe_predicate from '@q-mino/domains/seals/safe/_predicate.ts'
import type * as face_selections from '@q-mino/domains/seals/safe/_face_selection.ts'
import type * as face_calculations from '@q-mino/domains/seals/safe/_face_calculation.ts'
import type * as mailbox_key_selections from '@q-mino/domains/seals/safe/_mailbox_key_selection.ts'
import type { face_id, mailbox_key_id, seed_id } from '@q-mino/domains/seals/safe/_id.ts'
import { face, mailbox_key } from '@q-mino/domains/seals/safe/_value.ts'
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
import {
  execute_in,
  recorded_in,
  the_operators,
  type ADomainsStore,
  type Fragment,
  type Write,
} from '../command.ts'
import type { TheNodesStorage } from '../node.ts'
import {
  after,
  reads_in,
  selection_operators,
  type Field,
  type Selection,
  type Source,
} from '../reads.ts'
import { every_parsed, on_a_record, set, the_records_of_a_domain } from '../records.ts'

/** The path of the safe: its store's name (WEB-8). */
const the_safe_s_path = 'seals/safe'

/** The safe's records (WEB-8): its seeds, its faces and its mailbox keys, each kind by its id (SEA-1). */
const the_safe_s_records = the_records_of_a_domain(the_safe_s_path)

const the_seed = (id: seed_id) => the_safe_s_records.a('seed', id)
const the_face = (id: face_id) => the_safe_s_records.a('face', id)
const the_mailbox_key = (id: mailbox_key_id) => the_safe_s_records.a('mailbox_key', id)

const on_a_face = on_a_record(face)
const on_a_mailbox_key = on_a_record(mailbox_key)

export const seals_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof safe_predicate>,
  Fragment
> = {
  'seals/safe/predicate/a_face_has_this_id': (p) => on_a_face(the_face(p.face_id), a_face_is_there),
  'seals/safe/predicate/the_face_is_being_made': (p) =>
    on_a_face(the_face(p.face_id), the_face_is_being_made),
  'seals/safe/predicate/a_mailbox_key_has_this_id': (p) =>
    on_a_mailbox_key(the_mailbox_key(p.mailbox_key_id), a_mailbox_key_is_there),
  'seals/safe/predicate/the_mailbox_key_is_being_drawn': (p) =>
    on_a_mailbox_key(the_mailbox_key(p.mailbox_key_id), the_mailbox_key_is_being_drawn),
}

// The reads of the subject `seals/safe/selection/face`: a face in the safe.

export const face_selection: zz.Algebra<
  zz.SelectionsIn<typeof face_selections>,
  Selection<face>
> = {
  ...selection_operators<face>(),
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
  Selection<mailbox_key>
> = {
  ...selection_operators<mailbox_key>(),
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
): zz.CalculationFragments<zz.CalculationsIn<typeof face_calculations>, Field<face>> => ({
  'seals/safe/calculation/face/the_signature_of_a_content': (p) => () => (the_face) =>
    the_face.status === 'made'
      ? the_signature_of(primitives)(the_face.private_key, p.content)
      : undefined,
  'seals/safe/calculation/face/the_sealed_content_opened': (p) => () => (the_face) =>
    the_face.status === 'made'
      ? opened_with(primitives)(the_face.private_key, p.sealed_content)
      : undefined,
})

const every_face = the_safe_s_records.every('face')
const every_mailbox_key = the_safe_s_records.every('mailbox_key')

/** Every face in the safe: its selections read nothing more than the face. */
const the_faces: Source<face> = {
  reads: [every_face],
  candidates: (records) => every_parsed(face)(records, every_face),
}

/** Every mailbox key in the safe: its selections read nothing more than the key. */
const the_mailbox_keys: Source<mailbox_key> = {
  reads: [every_mailbox_key],
  candidates: (records) => every_parsed(mailbox_key)(records, every_mailbox_key),
}

/** The fields a face gives out of the safe (SEA-6): its id and its public key. */
const a_face_of_mine = {
  id: () => (the_face: face) => the_face.id,
  public_key: () => (the_face: face) => the_face.public_key,
}

export const face_sources: {
  readonly a_content_signed_by_a_face: zz.QuerySource<
    zz.FieldsOf<typeof safe_query.a_content_signed_by_a_face>,
    Source<face>,
    Field<face>
  >
  readonly a_sealed_content_opened_by_a_face: zz.QuerySource<
    zz.FieldsOf<typeof safe_query.a_sealed_content_opened_by_a_face>,
    Source<face>,
    Field<face>
  >
} = {
  a_content_signed_by_a_face: { from: the_faces, fields: a_face_of_mine },
  a_sealed_content_opened_by_a_face: { from: the_faces, fields: a_face_of_mine },
}

export const mailbox_key_sources: {
  readonly the_key_of_a_mailbox: zz.QuerySource<
    zz.FieldsOf<typeof safe_query.the_key_of_a_mailbox>,
    Source<mailbox_key>,
    Field<mailbox_key>
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

/** The writes of the safe's facts: each puts the values its fact carries, whole, as the oracle's (DOM-5). */
export const seals_writes: zz.FactWrites<zz.FactsIn<typeof safe_fact>, Write> = {
  'seals/safe/fact/a_face_has_been_asked_for': ({ face_being_made }) => ({
    reads: [],
    puts: () => [set(the_face(face_being_made.id), face_being_made)],
  }),
  'seals/safe/fact/a_face_has_been_made_from_a_new_seed': ({ new_seed, made_face }) => ({
    reads: [],
    puts: () => [set(the_seed(new_seed.id), new_seed), set(the_face(made_face.id), made_face)],
  }),
  'seals/safe/fact/a_mailbox_key_has_been_asked_for': ({ mailbox_key_being_drawn }) => ({
    reads: [],
    puts: () => [set(the_mailbox_key(mailbox_key_being_drawn.id), mailbox_key_being_drawn)],
  }),
  'seals/safe/fact/a_mailbox_key_has_been_drawn': ({ drawn_mailbox_key }) => ({
    reads: [],
    puts: () => [set(the_mailbox_key(drawn_mailbox_key.id), drawn_mailbox_key)],
  }),
}

/** The command use cases of `safe`: reached by reactions and the executor (PER-21). */
export const seals_command_use_cases = {
  make_a_face_from_a_new_seed,
  keep_a_new_seed_and_its_face,
  draw_a_mailbox_key,
  keep_a_mailbox_key,
}

/** The command adapter of `safe` on its store (WEB-9): fragments, writes, one transaction per command. */
export const seals_command_adapter = (storage: ADomainsStore) => ({
  algebra: { predicate: seals_fragments, ...the_operators },
  write: seals_writes,
  execute: execute_in(storage),
  recorded: recorded_in(storage),
})

/**
 * The ports of `seals/safe` on the node's database, as the oracle's
 * (TST-2): its commands, and its reads, by subject, a face's over the
 * primitives port. No read streams: a signature, an opening and a mailbox's
 * key are asked when needed (SEA-6).
 */
export const seals_ports_on_the_node_s_database = (
  node: Pick<TheNodesStorage, 'domain'>,
  primitives: Primitives,
) => {
  const storage = node.domain(the_safe_s_path)
  const reads = reads_in(storage)
  return (versions: zz.Versions): TheSafesPorts => ({
    ...zz.command_use_case_ports({
      registry,
      versions,
      use_cases: seals_command_use_cases,
    })(seals_command_adapter(storage)),
    ...zz.read_use_case_ports({
      registry,
      versions,
      use_cases: { a_content_signed_by_a_face, a_sealed_content_opened_by_a_face },
    })({
      algebra: { ...face_selection, after },
      sources: face_sources,
      calculations: face_calculation(primitives),
      read: reads.read,
      page: reads.page,
      streams: {},
    }),
    ...zz.read_use_case_ports({
      registry,
      versions,
      use_cases: { the_key_of_a_mailbox },
    })({
      algebra: { ...mailbox_key_selection, after },
      sources: mailbox_key_sources,
      read: reads.read,
      page: reads.page,
      streams: {},
    }),
  })
}
