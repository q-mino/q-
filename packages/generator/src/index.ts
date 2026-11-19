// The generator's core (DOM-25): from a tree as read to the files to write and
// the failures, pure, compiled without Node as the domains are. The shell
// (`../shell/`) walks the folders, reads the sources, imports the authored
// files and writes.

export type {
  AuthoredFile,
  Export,
  Failure,
  FileKind,
  Folder,
  GeneratedFile,
  Input,
  NodeParts,
  Past,
  Tree,
  Value,
} from './model.ts'
export type { Configuration, TreeConfiguration } from './configuration.ts'
export { scopes } from './scopes.ts'
export { twin } from './twins.ts'
export { doors } from './doors.ts'
export { registries } from './registries.ts'
export { map_rules, type CruiserPaths, type CruiserRule } from './rules.ts'
export { next_import, type Imports, type Next } from './order.ts'
export { layer_order, point_builders } from './kinds.ts'
export { generated } from './text.ts'
