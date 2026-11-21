// A frame's document and its sandbox (EXT-13, EXT-16, WEB-23; part 22.2):
// what the kernel places in a slot or a page. The document is the file of
// the extension's bundle the point `shows`, given by the composition root as
// text; the kernel puts its policy first, so that whatever the file holds is
// parsed below it: a `<meta>` policy is in force from where it is read, and
// a later one can only add limits (a document has every policy it reads).
// The frame is sandboxed with scripts only: its origin is opaque (no
// storage, no cookie, no service worker of the app's origin), it opens no
// window, sends no form, navigates no top. What the browser leaves open
// (a frame navigating itself, WebRTC) is measured in WEB-23 and told the
// user at activation (USR-7), never a promise (EXT-13).

/**
 * The kernel's policy of a frame (EXT-13): no connection (`fetch`, a
 * socket, a beacon), no source but the document itself (its inline scripts
 * and styles, its images and fonts as `data:`), no form, no base, no
 * frame, no worker.
 */
export const the_policy_of_a_frame = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data:',
  'font-src data:',
  'media-src data:',
  "form-action 'none'",
  "base-uri 'none'",
].join('; ')

/** The sandbox of a frame (EXT-13): scripts only, so that its origin is opaque and it opens nothing. */
export const the_sandbox_of_a_frame = 'allow-scripts'

/**
 * The document the kernel gives a frame (`srcdoc`): its policy, then the
 * extension's file as it is. A doctype or an `<html>` the file starts with
 * is read below the policy, where the parser ignores the doctype and merges
 * the element; nothing it holds can lift a limit read before it.
 */
export const the_document_of_a_frame = (file: string): string =>
  `<!doctype html><meta http-equiv="Content-Security-Policy" content="${the_policy_of_a_frame}">${file}`
