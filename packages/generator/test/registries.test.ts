import { describe, expect, it } from 'vitest'
import { registries, type Tree } from '../src/index.ts'
import { component, exported, file, folder, sight, text_in, value } from './trees.ts'

// The registries and the majors the core writes from a tree as read (DOM-24,
// DOM-22, PER-17): a persona of Shed with a past major, a business domain
// with a folder below it.

const tree: Tree = {
  sight,
  library: 'wlib.ts',
  folders: [
    folder('business/loans', [
      file('id', 'id', [exported('loan_id', component({ kind: 'id' }))]),
      file('dsl', 'dsl', [exported('the_day_after', { is: 'other' })]),
      file('loan_selection', 'selection', [
        exported('the_loan_is_ongoing', component({ kind: 'selection', subject: 'loan' })),
      ]),
      file('command', 'command', [
        exported('the_tool_can_be_lent', component({ kind: 'condition' })),
        exported('borrow_a_tool', component({ kind: 'command' }, 'function')),
      ]),
      file('version', 'version', [
        exported('loans', component({ kind: 'version' }, 'none', { is: 'current' }, { major: 2 })),
      ]),
    ]),
    folder('business/loans/1', [
      file('fact', 'fact', [
        exported('a_tool_has_been_lent', component({ kind: 'fact' }, 'none', { is: 'earlier' })),
      ]),
    ]),
    folder('business/loans/an_ongoing_loan', [
      file('usecase', 'usecase', [exported('extend_the_loan', component({ kind: 'usecase' }))]),
    ]),
    folder('persona', [file('value', 'value', [exported('caller', value())])]),
    folder('persona/member', [
      file('usecase', 'usecase', [
        exported('borrow_a_tool', component({ kind: 'usecase' }, 'schema')),
        exported('return_a_tool', component({ kind: 'usecase' }, 'schema')),
      ]),
      file('version', 'version', [
        exported('member', component({ kind: 'version' }, 'none', { is: 'current' }, { major: 2 })),
      ]),
    ]),
    folder('persona/member/1', [
      file('usecase', 'usecase', [
        exported('borrow_a_tool', component({ kind: 'usecase' }, 'schema', { is: 'earlier' })),
        exported(
          'return_a_tool',
          component({ kind: 'usecase' }, 'none', { is: 'delegated', next_input: 'schema' }),
        ),
      ]),
    ]),
  ],
}

const written = registries(tree).files

const entries_of = (path: string): readonly string[] =>
  text_in(written, path)
    .split('\n')
    .flatMap((line) => /^ {2}(?:'(\S+)': )?(\S+),$/.exec(line)?.slice(1, 3).join(' ').trim() ?? [])

describe('SC-46, the registries (DOM-24, DOM-22, PER-17)', () => {
  it('a domain lists every path of its folder in the order of the layers, a condition under its file kind, a selection under its subject, an input under its own; its subtree comes with it', () => {
    expect(entries_of('business/loans/_registry.ts')).toEqual([
      'business/loans/id/loan_id id.loan_id',
      'business/loans/selection/loan/the_loan_is_ongoing loan_selection.the_loan_is_ongoing',
      'business/loans/command/the_tool_can_be_lent command.the_tool_can_be_lent',
      'business/loans/command/borrow_a_tool command.borrow_a_tool',
      'business/loans/command/borrow_a_tool_input command.borrow_a_tool_input',
      'business/loans/version/loans version.loans',
      '...an_ongoing_loan',
    ])
    expect(text_in(written, 'business/loans/_registry.ts')).not.toContain('_dsl.ts')
  })

  it("a past major's registry is its whole map: every path of the major, the version apart, and a delegated leaf's input", () => {
    expect(entries_of('persona/member/1/_registry.ts')).toEqual([
      'persona/member/usecase/borrow_a_tool usecase.borrow_a_tool',
      'persona/member/usecase/borrow_a_tool_input usecase.borrow_a_tool_input',
      'persona/member/usecase/return_a_tool usecase.return_a_tool',
      'persona/member/usecase/return_a_tool_input usecase.return_a_tool_input',
    ])
    expect(entries_of('business/loans/1/_registry.ts')).toEqual([
      'business/loans/fact/a_tool_has_been_lent fact.a_tool_has_been_lent',
    ])
  })

  it('a folder above the domains carries none of them; a domain carries no past major', () => {
    expect(entries_of('persona/_registry.ts')).toEqual(['persona/value/caller value.caller'])
    expect(entries_of('persona/member/_registry.ts')).not.toContain('...1')
  })

  it("the majors of a domain with a version: the current's registry and each past major's, the newest first", () => {
    expect(text_in(written, 'persona/member/_majors.ts')).toContain(
      "import { registry as major_2 } from './_registry.ts'\nimport { registry as major_1 } from './1/_registry.ts'",
    )
    expect(text_in(written, 'persona/member/_majors.ts')).toContain(
      'export const majors = { 2: major_2, 1: major_1 } satisfies zz.Majors',
    )
    expect(written.map((one) => one.path).filter((path) => path.endsWith('_majors.ts'))).toEqual([
      'business/loans/_majors.ts',
      'persona/member/_majors.ts',
    ])
  })
})
