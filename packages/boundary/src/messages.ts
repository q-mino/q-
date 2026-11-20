import * as z from 'zod'
import { the_data_of_a_place } from './places.ts'
import {
  a_call_of_the_storage,
  a_request,
  an_answer_to_a_commit,
  an_answer_to_a_read,
  an_answer_to_a_request,
} from './ports.ts'
import { a_leaf, a_name, json, json_object, semver } from './values.ts'

// The messages of the boundary (EXT-2, EXT-15, EXT-16): one ADT per
// direction, by `message`, so that how an extension is loaded (with the app,
// in process, isolated: EXT-13) changes without changing what crosses it.
// Every message is a JSON value (a frame passes it as it is); the boundary
// carries, never translates (ADP-4). An exchange is paired by its `id`: an
// invocation and its events, a call and its answer; the side that opens it
// names it, unique among its exchanges in flight, so that several are in
// flight together (a request waits for its response).

/** The id of an exchange: an invocation and its events, a call and its answer. */
const an_id = z.string().min(1)

/** A dead letter of the extension's, by the name it gives it, unique among its letters (its effect's or reaction's path and its entry's id). */
const a_letter = z.string().min(1)

/** An event of a leaf's flow, as the boundary carries it: a JSON object named by `event`, typed by the surface, which the receiver parses (EXT-15). */
const an_event = z.object({ event: a_name }).catchall(json)

/** One event of the flow the `id` opened, in order (DOM-3). */
const event = z.strictObject({ message: z.literal('event'), id: an_id, event: an_event })

/** The flow the `id` opened has ended: no event follows. */
const done = z.strictObject({ message: z.literal('done'), id: an_id })

// From the kernel to an extension.

/**
 * An invocation of one of its leaves (EXT-2 "In"): the persona and the
 * leaf's path in its surface (EXT-5), the version its client speaks, the
 * context the kernel's node gives as far as the manifest lets it see
 * (EXT-3, EXT-11), for a command its operation (its id, for a peer's request
 * the request's identity, F7; its scope, composed by the kernel from the
 * hat and, on `known`, the bond's identity, EXT-2), the correlation if any
 * (DOM-10), and the input. Nothing of the letter it came in (F3).
 */
const invoke = z.strictObject({
  message: z.literal('invoke'),
  id: an_id,
  persona: z.enum(['self', 'known']),
  use_case: a_leaf,
  version: semver,
  context: json_object,
  operation: z.strictObject({ id: z.string().min(1), scope: z.string().min(1) }).optional(),
  correlation: z.string().min(1).optional(),
  input: json,
})

/** The kernel's answer to a call of the extension's, by its `id`, an ADT by the port called (EXT-2 "Calls"). */
const answer = z.discriminatedUnion('port', [
  z.strictObject({
    message: z.literal('answer'),
    id: an_id,
    port: z.literal('the_port_of_requests'),
    answer: an_answer_to_a_request,
  }),
  z.strictObject({
    message: z.literal('answer'),
    id: an_id,
    port: z.literal('its_storage'),
    answer: z.union([an_answer_to_a_read, an_answer_to_a_commit]),
  }),
])

/**
 * The messages from the kernel to an extension (EXT-2, EXT-15): an
 * invocation; the answer to one of its calls; the start and the stop of its
 * consumers (its executor, its reactions); the user's request on one of its
 * dead letters, `redeliver` or `discard`, by the letter's name, handed to
 * its executor or consumers (DOM-14: on a phone the operator is the user,
 * DOM-15), a discard with who and why, as the library traces it.
 */
export const a_message_to_an_extension = z.discriminatedUnion('message', [
  invoke,
  answer,
  z.strictObject({ message: z.literal('start') }),
  z.strictObject({ message: z.literal('stop') }),
  z.strictObject({ message: z.literal('redeliver'), letter: a_letter }),
  z.strictObject({
    message: z.literal('discard'),
    letter: a_letter,
    by: z.string().min(1),
    reason: z.string().min(1),
  }),
])
export type a_message_to_an_extension = z.output<typeof a_message_to_an_extension>

// From an extension to the kernel.

/** A call of the extension's to a port of the kernel's its manifest declares (EXT-2 "Calls"), an ADT by the port. */
const call = z.discriminatedUnion('port', [
  z.strictObject({
    message: z.literal('call'),
    id: an_id,
    port: z.literal('the_port_of_requests'),
    request: a_request,
  }),
  z.strictObject({
    message: z.literal('call'),
    id: an_id,
    port: z.literal('its_storage'),
    request: a_call_of_the_storage,
  }),
])

/**
 * The messages from an extension to the kernel (EXT-2, EXT-15): an event of
 * an invocation's flow, and its end; a call; its life, `ready` with its
 * name, its version and its boundary version (the kernel compares them with
 * the manifest installed), and `fallen`, why; its notices, claims of the
 * extension (F2) the kernel shows in its mark (EXT-16), never reading its
 * partition (EXT-14): a dead letter of its executor or its consumers (whose:
 * an effect's or a reaction's, by path; the entry; the cause), a letter
 * released (delivered at last, or discarded: no longer shown), an entry of
 * its trees' trace (PER-14).
 */
export const a_message_from_an_extension = z.discriminatedUnion('message', [
  event,
  done,
  call,
  z.strictObject({
    message: z.literal('ready'),
    name: a_name,
    version: semver,
    boundary_version: semver,
  }),
  z.strictObject({ message: z.literal('fallen'), why: z.string() }),
  z.strictObject({
    message: z.literal('dead_letter'),
    letter: a_letter,
    of: z.enum(['an_effect', 'a_reaction']),
    path: z.string().min(1),
    entry: json,
    cause: json,
  }),
  z.strictObject({ message: z.literal('released'), letter: a_letter }),
  z.strictObject({ message: z.literal('traced'), entry: json }),
])
export type a_message_from_an_extension = z.output<typeof a_message_from_an_extension>

// Between a frame and the kernel (EXT-2 "Its frames' messages", EXT-16).

/** Where the kernel placed a frame, with the place's data (EXT-16), an ADT by place. */
const placed = z.discriminatedUnion('place', [
  z.strictObject({
    message: z.literal('placed'),
    place: z.literal('a_bond'),
    data: the_data_of_a_place.a_bond,
  }),
  z.strictObject({
    message: z.literal('placed'),
    place: z.literal('the_extension'),
    data: the_data_of_a_place.the_extension,
  }),
])

/** The messages from the kernel to a frame: its place's data; the events of what it invoked or follows, and their end. */
export const a_message_to_a_frame = z.discriminatedUnion('message', [placed, event, done])
export type a_message_to_a_frame = z.output<typeof a_message_to_a_frame>

/**
 * The messages from a frame to the kernel (EXT-16): an invocation of a leaf
 * on `self`, and a read it follows there, each by its path and the version
 * the frame speaks; its own extension's only, with no extension's name in
 * it: the kernel adds it (EXT-4, a frame's fence).
 */
export const a_message_from_a_frame = z.discriminatedUnion('message', [
  z.strictObject({
    message: z.literal('invoke'),
    id: an_id,
    use_case: a_leaf,
    version: semver,
    input: json,
  }),
  z.strictObject({
    message: z.literal('follow'),
    id: an_id,
    use_case: a_leaf,
    version: semver,
    input: json,
  }),
])
export type a_message_from_a_frame = z.output<typeof a_message_from_a_frame>
