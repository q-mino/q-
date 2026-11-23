// The module of `post` in q-'s oracle (TST-2, MBX-7): the state of
// `post/requests`, the port of requests' record, its predicates and its
// selection as functions of that state, its source and its writes, the
// meaning from the domain's `dsl` (DOM-5); and the domain's command and read
// ports over a cell (PST-5..PST-8). On the model of `bonds.ts`: a phone's
// cell holds the requests beside the safe (part 10.2).

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

/**
 * The port of requests' record (PST-5): the requests sent, by their
 * identity, under the domain's name, so that it sits beside the safe's state
 * and the address book's in a phone's cell.
 */
export interface PostState {
  readonly requests: ReadonlyMap<request_id, request>
}

/** A record that holds no request yet: a phone before its first. */
export const no_request: PostState = { requests: new Map() }

const the_request = (state: PostState, id: request_id): request | undefined =>
  state.requests.get(id)

export const post_fragments: zz.PredicateFragments<
  zz.PredicatesIn<typeof requests_predicate>,
  (state: PostState) => boolean
> = {
  'post/requests/predicate/a_request_has_this_id': (p) => (state) =>
    a_request_is_there(the_request(state, p.request_id)),
  'post/requests/predicate/the_request_is_waiting': (p) => (state) =>
    the_request_is_waiting(the_request(state, p.request_id)),
  'post/requests/predicate/the_request_has_been_answered': (p) => (state) =>
    the_request_has_been_answered(the_request(state, p.request_id)),
  'post/requests/predicate/the_request_has_been_called_off': (p) => (state) =>
    the_request_has_been_called_off(the_request(state, p.request_id)),
  'post/requests/predicate/the_time_of_the_request_is_not_over': (p) => (state) =>
    the_time_of_the_request_is_not_over(p.now)(the_request(state, p.request_id)),
  'post/requests/predicate/the_request_went_to_this_face': (p) => (state) =>
    the_request_went_to_this_face(p.key)(the_request(state, p.request_id)),
}

// The reads of the subject `post/requests/selection/request`: a request of the record.

export const request_selection: zz.Algebra<
  zz.SelectionsIn<typeof request_selections>,
  Selection<PostState, request>
> = {
  ...selection_operators<PostState, request>(),
  predicate: {
    'post/requests/selection/request/the_request_has_this_id': (p) => () => (sent) =>
      sent.id === p.request_id,
    'post/requests/selection/request/the_request_is_waiting': () => () => (sent) =>
      the_request_is_waiting(sent),
  },
}

const the_requests: Source<PostState, request> = (state) => [...state.requests.values()]

export const request_sources: {
  readonly the_answer_to_a_request: zz.QuerySource<
    zz.FieldsOf<typeof requests_query.the_answer_to_a_request>,
    Source<PostState, request>,
    Field<PostState, request>
  >
  readonly the_requests_waiting: zz.QuerySource<
    zz.FieldsOf<typeof requests_query.the_requests_waiting>,
    Source<PostState, request>,
    Field<PostState, request>
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
 * request in no state of the domain's fails the story (an interpreter rule,
 * as `bonds.ts`).
 */
const with_the_request =
  (id: request_id, change: Partial<request>) =>
  (state: PostState): Partial<PostState> => {
    const before = the_request(state, id)
    return before === undefined
      ? {}
      : { requests: new Map(state.requests).set(id, request.parse({ ...before, ...change })) }
  }

/** A fact that changes nothing (DOM-6). */
const nothing = (): Partial<PostState> => ({})

export const post_writes: zz.FactWrites<
  zz.FactsIn<typeof requests_fact>,
  (state: PostState) => Partial<PostState>
> = {
  'post/requests/fact/a_request_has_been_sent':
    ({ sent_request }) =>
    (state) => ({
      requests: new Map(state.requests).set(sent_request.id, request.parse(sent_request)),
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

/** The command use cases of `post/requests`, whose ports the oracle builds: the port of requests' (12.4), the kernel's entry's (13), the executor's (DOM-14), the kernel's calling off (EXT-7). */
export const post_command_use_cases = {
  send_a_request,
  call_off_a_request,
  send_a_request_again,
  close_a_request_with_no_response,
  take_a_response,
}

/** The oracle's state adapter for the commands of `post/requests` (TST-2): fragments, writes, the execution. */
export const post_command_adapter = (cell: CommandCell<PostState>) => ({
  algebra: algebra<PostState, typeof post_fragments>(post_fragments),
  write: post_writes,
  execute: execute(cell),
  recorded: recorded(cell),
})

/**
 * The ports of `post/requests` over the oracle (TST-2): its commands, and
 * the answer kept under an identity. A request's fact holds the face that
 * signs it, an identity of the safe's, a resource of the fact (DOM-10):
 * the safe's registry names it (`identities`). No read streams: the port of
 * requests follows a request's facts on the log (PST-8, 12.4).
 */
export const post_ports =
  (cell: CommandCell<PostState> & ReadCell<PostState>) => (versions: zz.Versions) => ({
    ...zz.command_use_case_ports({
      registry,
      identities: safe_registry,
      versions,
      use_cases: post_command_use_cases,
    })(post_command_adapter(cell)),
    ...zz.read_use_case_ports({
      registry,
      identities: safe_registry,
      versions,
      use_cases: { the_answer_to_a_request, the_requests_waiting },
    })({
      algebra: { ...request_selection, after },
      sources: request_sources,
      read: read(cell),
      page: page(cell),
      streams: {},
    }),
  })

/** The post's ports (`post/requests`), by name (WEB-16, CFG-5): what a phone's storage gives of it, the oracle's or another, its type written once. */
export interface ThePostsPorts extends ReturnType<ReturnType<typeof post_ports>> {}
