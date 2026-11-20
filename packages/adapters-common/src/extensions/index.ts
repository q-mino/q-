// The kernel's side of the extensions (EXT-2, EXT-4, EXT-6, EXT-7, EXT-13,
// EXT-15, F7; GR-10; part 12.4): the kernel's adapters that compose and host
// extensions, importing `boundary` and the library; `domains` never does,
// so the manifest is translated here into the office's words (`activations`).
// In the browser and in Node alike: the transport to an extension's realm
// and its partition's technology are the configurator's (`memory` on the
// oracle, `phone` with step 22).

export { through_a_frames_fence } from './a_frames_fence.ts'
export { the_kernels_reads, the_manifest_to_accept } from './activations.ts'
export type { TheKernelsReads, TheOfficesReads } from './activations.ts'
export type { AFrame, Fenced } from './a_frames_fence.ts'
export {
  a_composition_fault,
  compose_an_extension,
  the_kernels_offer,
  the_marks_in,
} from './composition.ts'
export type { ACompositionFault, Composed, Composition, TheKernelsOffer } from './composition.ts'
export { a_hosted_extension } from './hosting.ts'
export type {
  ANotice,
  Handed,
  Hosted,
  HostingWiring,
  Life,
  Loaded,
  TheBondAsTheNodeGivesIt,
  Transport,
} from './hosting.ts'
export { as_traced, route } from './the_kernels_trace.ts'
export type {
  AFence,
  ARequestAsItCame,
  ASilence,
  Routed,
  TheKernelsTrace,
  TheKernelsTraced,
} from './the_kernels_trace.ts'
export { the_port_of_requests, the_scope_of_the_port_of_requests } from './the_port_of_requests.ts'
export type {
  ABondToAskOn,
  TheAnswerKeptEvent,
  ThePortOfRequestsWiring,
} from './the_port_of_requests.ts'
