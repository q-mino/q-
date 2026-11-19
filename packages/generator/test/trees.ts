import type {
  AuthoredFile,
  Export,
  FileKind,
  Folder,
  GeneratedFile,
  Tree,
  Value,
} from '../src/index.ts'

// Trees as the shell reads them, for the core's tests: Shed's map and
// folders, its files reduced to their kinds (DOM-25).

/** An authored file of a kind, exporting these names, or these exports. */
export const file = (
  stem: string,
  kind: FileKind,
  names: readonly (string | Export)[] = [],
): AuthoredFile => ({
  stem,
  kind,
  exports: names.map((name) =>
    typeof name === 'string' ? { name, doc: [], input_doc: [] } : name,
  ),
})

/** A folder by its path from the root. */
export const folder = (path: string, files: readonly AuthoredFile[]): Folder => ({
  segments: path.split('/'),
  files,
})

/** An export with what the runtime says of it. */
export const exported = (name: string, value: Value): Export => ({
  name,
  doc: [],
  input_doc: [],
  value,
})

/** Shed's map (`sight.ts`). */
export const sight: Tree['sight'] = {
  business: { business: ['id'] },
  persona: { business: ['usecase', 'id', 'fact'], auth: ['lookup', 'id'] },
  reaction: { business: ['usecase', 'fact'] },
  auth: {},
}

/** Shed, its files reduced to their kinds; `business/notes` holds a value alone, which no other domain sees. */
export const shed: Tree = {
  sight,
  library: 'wlib.ts',
  folders: [
    folder('auth/accounts', [file('id', 'id'), file('lookup', 'lookup')]),
    folder('business/loans', [
      file('id', 'id'),
      file('value', 'value'),
      file('fact', 'fact'),
      file('command', 'command'),
      file('usecase', 'usecase'),
      file('reaction', 'reaction'),
    ]),
    folder('business/loans/1', [file('fact', 'fact')]),
    folder('business/loans/an_ongoing_loan', [
      file('node', 'node', ['an_ongoing_loan']),
      file('command', 'command'),
      file('usecase', 'usecase'),
    ]),
    folder('business/notes', [file('value', 'value')]),
    folder('business/tools', [file('id', 'id'), file('fact', 'fact'), file('usecase', 'usecase')]),
    folder('persona', [file('value', 'value'), file('node', 'node', ['persona'])]),
    folder('persona/member', [file('node', 'node', ['member']), file('usecase', 'usecase')]),
    folder('reaction/damage', [file('dsl', 'dsl'), file('reaction', 'reaction')]),
  ],
}

/** The text of a generated file among these, by its path. */
export const text_in = (files: readonly GeneratedFile[], path: string): string => {
  const found = files.find((one) => one.path === path)
  if (found === undefined) throw new Error(`no ${path}`)
  return found.text
}

/** The namespaces a generated file re-exports, as `name module`. */
export const namespaces_in = (files: readonly GeneratedFile[], path: string): readonly string[] =>
  text_in(files, path)
    .split('\n')
    .flatMap((line) => /^export \* as (\S+) from '(\S+)'$/.exec(line)?.slice(1, 3).join(' ') ?? [])
