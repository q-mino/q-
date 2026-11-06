// The compiler's pure core (LIB-20): source facts in, generated files or errors out.
import { analyze, type CompileError, type SourceTree } from './analyze.ts'
import { generate, type GeneratedFile, type GenerateOptions } from './generate.ts'

export type CompileResult =
  | { readonly ok: true; readonly files: readonly GeneratedFile[] }
  | { readonly ok: false; readonly errors: readonly CompileError[] }

export function compile(tree: SourceTree, options: GenerateOptions): CompileResult {
  const result = analyze(tree)
  if (!result.ok) return result
  return { ok: true, files: generate(result.analysis, options) }
}
