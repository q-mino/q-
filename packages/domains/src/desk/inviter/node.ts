import { node, _desk } from './_scope_node.ts'

// The node of `inviter` (PER-6, PER-7, INV-5): who wears the hat shows the
// signature of a stand's inviter, which the desk's interface verified with
// the key the relay's configuration names for that stand. Which stand it
// leaves on the leaf asks, from the stand its input names. All pure.

/** The assistant, signing with its stand's key: who shows no such signature is not found here. */
export const inviter = node({
  is_found_only_if: {
    /** No signature that verifies: "not found", no reason (D87.5, PER-14). */
    the_caller_is_a_stand_s_inviter: (context) => () =>
      _desk.dsl.the_caller_is_a_stand_s_inviter(context.caller),
  },
})
