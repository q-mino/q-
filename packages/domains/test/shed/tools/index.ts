// The surface of `tools` for the other domains (GR-1, GR-3), chosen in
// `-surface/`: everything else is internal. Access mirrors the path (DOM-24):
// `tools.predicate.the_tool_is_in_service` is `tools/predicate/the_tool_is_in_service`.
// Re-exports, not objects, so that the JSDoc of the members reaches the consumer.

export * as predicate from './-surface/predicate.ts'
export * as value from './-surface/value.ts'
