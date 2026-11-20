import { node, _persona } from './_scope_node.ts'

// The node of `self` (PER-3, PER-6, PER-7): who wears it is the user of this
// node, from the app, never a letter. It gives nothing: the context on
// `self` is the root's alone; the active face comes with stage 2 (more
// faces, PER-3). All pure: no lookup.

/** Anna on her phone: Bruno's letter, signed or not, is not found here. */
export const self = node({
  is_found_only_if: {
    /** A letter, from a face or anonymous: "not found", no reason (D87.5, PER-14). */
    the_caller_is_the_user: (context) => () => _persona.dsl.the_caller_is_the_user(context),
  },
})
