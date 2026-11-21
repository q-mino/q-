// A frame's document and sandbox (WEB-23): what the kernel places in a slot or a page.
export {
  the_document_of_a_frame,
  the_policy_of_a_frame,
  the_sandbox_of_a_frame,
} from './the_document_of_a_frame.ts'
// An extension's realm in a frame of its own (PWA-3).
export {
  a_realm_in_a_frame,
  the_document_of_a_realm,
  the_script_inline,
  type ThePageOfTheRealms,
} from './a_realm_in_a_frame.ts'
