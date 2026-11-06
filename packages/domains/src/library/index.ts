// library: what every domain shares (see docs/architecture.md).
// It never imports a domain and never names a Q- concept.
export {
  instance,
  set,
  type Aggregation,
  type CommandComponent,
  type Component,
  type ComponentTree,
  type PredicateComponent,
  type Reads,
  type SchemaComponent,
} from './components.ts'
export {
  analyze,
  type Analysis,
  type AnalysisResult,
  type CompileError,
  type CompileErrorCode,
  type ExportForm,
  type SourceExport,
  type SourceMarker,
  type SourceModule,
  type SourceTree,
} from './conventions/analyze.ts'
export { compile, type CompileResult } from './conventions/compile.ts'
export { type GeneratedFile, type GenerateOptions } from './conventions/generate.ts'
export {
  arrowsFile,
  kinds,
  markerModule,
  roleOf,
  surfaceKinds,
  type Kind,
  type ModuleRole,
} from './conventions/names.ts'
