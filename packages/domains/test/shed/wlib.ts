// Shed's wished library (DOM-25): the library Shed asks for, the requirement
// of the library's steps of the plan. Since part 3.1 the library's types are
// in `domains/src/library/` (zen0), with the values that already had a body:
// this file re-exported it and declared with no body what was still to be
// built, grouped by the part of the plan that gave each its body; each part
// moved its declarations into the library, so that its diff showed them
// leave. Since part 7.3 nothing is left without a body: this file is the
// re-export alone, until 7.5, when Shed imports the library and this file is
// deleted (`docs/plan.md`).

export * from '../../src/library/index.ts'
