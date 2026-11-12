// generated

// The door of `business/tools` (DOM-25): what the folder exposes to whoever is
// outside it, flat, under the components' names. A business domain's door
// exposes its use cases and its identities only, by the architecture's rule
// (DOM-2, GR-1): from outside, its commands and queries cannot even be named.
// Inside the folder the files import the twins, never the door.

export { add_a_tool, retire_a_tool, the_catalogue } from './_usecase.ts'
export { tool_id } from './_id.ts'
