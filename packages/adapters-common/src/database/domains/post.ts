// The module of `post` on the node's database (IndexedDB, SQLite) (WEB-8, WEB-9, part 21.2): the oracle's
// (TST-2, `memory`'s `oracle/post.ts`) over the store of `post/requests`.
// Its one map, the requests sent by their identity, is a kind of record:
// `['state', 'request', request_id]`, a request of the record, parsed with
// the domain's `_value.ts` when read, and when a fact changes it, as the
// oracle parses after a write. A predicate reads its request's key; a write
// reads the request it changes; the query reads every request by range and
// selects in memory (WEB-8). The meaning from the domain's `dsl` (DOM-5).

import type { ThePostsPorts } from '../../ports/index.ts'
import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/post/requests/_registry.ts'
import { registry as safe_registry } from '@q-mino/domains/seals/safe/_registry.ts'
import type * as requests_fact from '@q-mino/domains/post/requests/_fact.ts'
import type * as requests_predicate from '@q-mino/domains/post/requests/_predicate.ts'
import type * as requests_query from '@q-mino/domains/post/requests/_query.ts'
import type * as request_selections from '@q-mino/domains/post/requests/_request_selection.ts'
import type { request_id } from '@q-mino/domains/post/requests/_id.ts'
import { request } from '@q-mino/domains/post/requests/_value.ts'
import {
  a_request_is_there,
  the_answer_of,
  the_card_of_a_waiting_request,
  the_request_has_been_answered,
  the_request_has_been_called_off,
  the_request_is_waiting,
  the_request_went_to_this_face,
  the_time_of_the_request_is_not_over,
} from '@q-mino/domains/post/requests/_dsl.ts'
import {
  call_off_a_request,
  close_a_request_with_no_response,
  send_a_request,
  send_a_request_again,
  take_a_response,
  the_answer_to_a_request,
  the_requests_waiting,
} from '@q-mino/domains/post/requests/_usecase.ts'
import {
  execute_in,
  recorded_in,
  the_operators,
  type AKey,
  type Fragment,
  type Write,
} from '../command.ts'
import type { ADomainsStorage, TheNodesStorage } from '../node.ts'
import {
  after,
  reads_in,
  selection_operators,
  type Field,
  type Selection,
  type Source,
} from '../reads.ts'
import { every_parsed, on_a_record, parsed, set, the_records_of_a_domain } from '../records.ts'

/** The path of the domain, its store's name (WEB-8). */
const the_path = 'post/requests'

/** The requests' records (WEB-8): `['state', 'request', request_id]` a request of the record. */
const the_requests_records = the_records_of_a_domain(the_path)

/** The key of a request, by its identity. */
const the_request = (id: request_id): AKey => the_requests_records.a('request', id)

/** Every request of the record. */
const every_request = the_requests_records.every('request')

/** A fragment over a request: its record read, parsed, and judged by the domain's `dsl`. */
const on_the_request = (
  id: request_id,
  holds: (the_request: request | undefined) => boolean,
): Fragment => on_a_record(request)(the_request(id), holds)

const post_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof requests_predicate>,
  Fragment
> = {
  'post/requests/predicate/a_request_has_this_id': (p) =>
    on_the_request(p.request_id, a_request_is_there),
  'post/requests/predicate/the_request_is_waiting': (p) =>
    on_the_request(p.request_id, the_request_is_waiting),
  'post/requests/predicate/the_request_has_been_answered': (p) =>
    on_the_request(p.request_id, the_request_has_been_answered),
  'post/requests/predicate/the_request_has_been_called_off': (p) =>
    on_the_request(p.request_id, the_request_has_been_called_off),
  'post/requests/predicate/the_time_of_the_request_is_not_over': (p) =>
    on_the_request(p.request_id, the_time_of_the_request_is_not_over(p.now)),
  'post/requests/predicate/the_request_went_to_this_face': (p) =>
    on_the_request(p.request_id, the_request_went_to_this_face(p.key)),
}

// The reads of the subject `post/requests/selection/request`: a request of the record.

const request_selection: zz.Algebra<
  zz.SelectionsIn<typeof request_selections>,
  Selection<request>
> = {
  ...selection_operators<request>(),
  predicate: {
    'post/requests/selection/request/the_request_has_this_id': (p) => () => (sent) =>
      sent.id === p.request_id,
    'post/requests/selection/request/the_request_is_waiting': () => () => (sent) =>
      the_request_is_waiting(sent),
  },
}

/** The requests of the record, read by range: a selection reads nothing more than its candidate. */
const the_requests: Source<request> = {
  reads: [every_request],
  candidates: (records) => every_parsed(request)(records, every_request),
}

const request_sources: {
  readonly the_answer_to_a_request: zz.QuerySource<
    zz.FieldsOf<typeof requests_query.the_answer_to_a_request>,
    Source<request>,
    Field<request>
  >
  readonly the_requests_waiting: zz.QuerySource<
    zz.FieldsOf<typeof requests_query.the_requests_waiting>,
    Source<request>,
    Field<request>
  >
} = {
  the_answer_to_a_request: {
    from: the_requests,
    fields: {
      id: () => (sent) => sent.id,
      answer: () => (sent) => the_answer_of(sent),
    },
  },
  the_requests_waiting: {
    from: the_requests,
    fields: {
      id: () => (sent) => sent.id,
      invokes: () => (sent) => the_card_of_a_waiting_request(sent).invokes,
      face_id: () => (sent) => the_card_of_a_waiting_request(sent).face_id,
      their_key: () => (sent) => the_card_of_a_waiting_request(sent).their_key,
    },
  },
}

/**
 * A request after a fact's change: the request as it was, the change over
 * it, parsed as a request of the record, so that a fact that leaves a
 * request in no state of the domain's fails its command (as the oracle).
 * No request under the identity: nothing written.
 */
const with_the_request = (id: request_id, change: Partial<request>): Write => ({
  reads: [the_request(id)],
  puts: (records) => {
    const before = parsed(request)(records.of(the_request(id)))
    return before === undefined
      ? []
      : [set(the_request(id), request.parse({ ...before, ...change }))]
  },
})

/** A fact that changes nothing (DOM-6). */
const nothing: Write = { reads: [], puts: () => [] }

const post_writes: zz.FactWrites<zz.FactsIn<typeof requests_fact>, Write> = {
  'post/requests/fact/a_request_has_been_sent': ({ sent_request }) => ({
    reads: [],
    puts: () => [set(the_request(sent_request.id), request.parse(sent_request))],
  }),
  'post/requests/fact/a_request_has_been_sent_again': () => nothing,
  'post/requests/fact/the_time_to_send_again_came_too_late': () => nothing,
  'post/requests/fact/a_request_has_been_answered': ({ request_id, event }) =>
    with_the_request(request_id, { status: 'answered', event }),
  'post/requests/fact/a_request_had_no_response': ({ request_id }) =>
    with_the_request(request_id, { status: 'no_response' }),
  'post/requests/fact/the_response_came_before_the_time': () => nothing,
  'post/requests/fact/a_request_has_been_called_off': ({ request_id, why }) =>
    with_the_request(request_id, { status: 'called_off', why }),
  'post/requests/fact/the_call_off_came_before_the_time': () => nothing,
}

/** The command use cases of `post/requests`: the port of requests' (12.4), the kernel's entry's (13), the executor's (DOM-14), the kernel's calling off (PST-14). */
const post_command_use_cases = {
  send_a_request,
  call_off_a_request,
  send_a_request_again,
  close_a_request_with_no_response,
  take_a_response,
}

/** The state adapter of the commands of `post/requests` on the node's database: fragments, writes, one transaction per command (WEB-9). */
const post_command_adapter = (storage: ADomainsStorage) => ({
  algebra: { predicate: post_fragments, ...the_operators },
  write: post_writes,
  execute: execute_in(storage),
  recorded: recorded_in(storage),
})

/**
 * The ports of `post/requests` on the node's database, as the oracle's (TST-2): its
 * commands, and the answer kept under an identity. A request's fact holds
 * the face that signs it, an identity of the safe's (`identities`, DOM-10).
 * No read streams: the port of requests follows a request's facts on the
 * log (PST-8, 12.4).
 */
export const post_ports_on_the_node_s_database =
  (node: Pick<TheNodesStorage, 'domain'>) =>
  (versions: zz.Versions): ThePostsPorts => {
    const storage = node.domain(the_path)
    const reads = reads_in(storage)
    return {
      ...zz.command_use_case_ports({
        registry,
        identities: safe_registry,
        versions,
        use_cases: post_command_use_cases,
      })(post_command_adapter(storage)),
      ...zz.read_use_case_ports({
        registry,
        identities: safe_registry,
        versions,
        use_cases: { the_answer_to_a_request, the_requests_waiting },
      })({
        algebra: { ...request_selection, after },
        sources: request_sources,
        read: reads.read,
        page: reads.page,
        streams: {},
      }),
    }
  }
