import { node, _desk } from './_scope_node.ts'

// The node of `holder` (PER-6, PER-7): who wears the hat shows a collect
// secret. Which mailbox it opens the leaf asks, from the address its request
// names (MBX-3). All pure: the desk's auth is trivial (PER-19).

/** Bruno's phone, with the R of his mailbox: who shows none is not found here. */
export const holder = node({
  is_found_only_if: {
    /** No collect secret: "not found", no reason (D87.5, PER-14). */
    the_caller_shows_a_collect_secret: (context) => () =>
      _desk.dsl.the_caller_shows_a_collect_secret(context.caller),
  },
})
