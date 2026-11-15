// generated

// The door of `business/tools` (DOM-25): what the folder exposes to whoever is
// outside it, flat, under the components' names. A business domain's door
// exposes its use cases, its identities and its facts, by the architecture's
// rule (DOM-2, GR-1): from outside, its commands and queries cannot even be
// named. Its facts are its published contract (D101): a reaction names the
// one it reacts to (DOM-16), and a fact gives no one access to the log.
// Inside the folder the files import the twins, never the door.

export { add_a_tool, retire_a_tool, the_catalogue } from './_usecase.ts'
export { tool_id } from './_id.ts'
export {
  a_tool_has_been_added,
  a_tool_has_been_retired,
  the_tool_was_already_retired,
} from './_fact.ts'
