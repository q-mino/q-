import { describe, expect, it } from 'vitest'
import {
  checks,
  doors,
  forgotten,
  registries,
  scopes,
  type Failure,
  type Tree,
} from '../src/index.ts'
import { component, exported, file, folder, value } from './trees.ts'

// The generator's checks on fixture trees (DOM-22, DOM-24, DOM-25): each
// stops a tree with its message, one line as tsc and ESLint write theirs
// (`file:line  rule  sentence`, provisional: A to confirm). SC-46.

const lines = (failures: readonly Failure[]): readonly string[] =>
  failures.map(
    (failure) => `${failure.path}:${String(failure.line)}  ${failure.rule}  ${failure.sentence}`,
  )

const sight: Tree['sight'] = { business: { business: ['id'] }, persona: { business: ['usecase'] } }

const tree = (folders: Tree['folders']): Tree => ({ sight, library: 'wlib.ts', folders })

const version = (major: number) =>
  file('version', 'version', [
    exported('things', component({ kind: 'version' }, 'none', { is: 'current' }, { major })),
  ])

/** A tree every check passes: a domain with a version and a past major, a folder below it. */
const sound = tree([
  folder('business/things', [
    file('id', 'id', [exported('thing_id', component({ kind: 'id' }), 3)]),
    file('fact', 'fact', [exported('a_thing_has_been_added', component({ kind: 'fact' }), 4)]),
    version(2),
  ]),
  folder('business/things/1', [
    file('fact', 'fact', [
      exported(
        'a_thing_has_been_added',
        component({ kind: 'fact' }, 'none', { is: 'delegated', next_input: 'none' }),
      ),
    ]),
  ]),
  folder('business/things/one_thing', [file('command', 'command')]),
])

describe("the generator's checks", () => {
  it('pass a sound tree', () => {
    expect(lines(checks(sound))).toEqual([])
    expect(lines(scopes(sound).failures)).toEqual([])
    expect(lines(doors(sound).failures)).toEqual([])
    expect(lines(registries(sound).failures)).toEqual([])
  })

  it('stop on a component exported under two names, or named as an input: one object, one path (DOM-24)', () => {
    expect(
      lines(
        checks(
          tree([
            folder('business/things', [
              file('fact', 'fact', [
                exported(
                  'a_thing_has_been_added',
                  component({ kind: 'fact' }, 'none', undefined, { identity: 7 }),
                  3,
                ),
                exported(
                  'a_thing_was_added',
                  component({ kind: 'fact' }, 'none', undefined, { identity: 7 }),
                  12,
                ),
              ]),
              file('value', 'value', [exported('thing', value(8), 2)]),
              file('command', 'command', [
                exported(
                  'add_a_thing',
                  component({ kind: 'command' }, 'schema', undefined, { input_identity: 8 }),
                  5,
                ),
              ]),
            ]),
            folder('business/others', [
              file('id', 'id', [
                exported(
                  'thing_id',
                  component({ kind: 'id' }, 'none', undefined, { identity: 9 }),
                  2,
                ),
              ]),
            ]),
            folder('business/more', [
              file('id', 'id', [
                exported(
                  'thing_id',
                  component({ kind: 'id' }, 'none', undefined, { identity: 9 }),
                  6,
                ),
              ]),
            ]),
          ]),
        ),
      ),
    ).toEqual([
      'business/things/fact.ts:12  DOM-24  business/things/fact/a_thing_has_been_added is exported twice, as a_thing_has_been_added and a_thing_was_added: one object, one path',
      'business/things/command.ts:5  DOM-24  business/things/command/add_a_thing_input and business/things/value/thing are one object: one object, one path',
      'business/more/id.ts:6  DOM-24  business/others/id/thing_id is exported twice, as business/others/id/thing_id and business/more/id/thing_id: one object, one path',
    ])
  })

  it('stop on two of one kind with one name in a folder, an input among them (DOM-25)', () => {
    expect(
      lines(
        checks(
          tree([
            folder('business/things', [
              file('fact', 'fact', [
                exported('a_thing_has_been_added', component({ kind: 'fact' }), 3),
              ]),
              file('more_facts', 'fact', [
                exported('a_thing_has_been_added', component({ kind: 'fact' }), 8),
              ]),
              file('command', 'command', [
                exported('add_a_thing', component({ kind: 'command' }, 'schema'), 4),
                exported('add_a_thing_input', component({ kind: 'command' }), 20),
              ]),
            ]),
          ]),
        ),
      ),
    ).toEqual([
      'business/things/more_facts.ts:8  DOM-25  business/things/fact/a_thing_has_been_added is declared twice, in fact.ts and in more_facts.ts: a name is unique per folder and kind',
      'business/things/command.ts:20  DOM-25  business/things/command/add_a_thing_input is declared twice, as the input of add_a_thing in command.ts and in command.ts: a name is unique per folder and kind',
    ])
  })

  it('stop on a component reachable and not exported (DOM-25), once every file is imported', () => {
    const reaching = (imported: boolean): Tree =>
      tree([
        folder('business/things', [
          file('predicate', 'predicate', [
            exported(
              'a_thing_has_this_id',
              component({ kind: 'predicate' }, 'none', undefined, { identity: 21 }),
              3,
            ),
          ]),
          file('command', 'command', [
            exported(
              'add_a_thing',
              component({ kind: 'command' }, 'none', undefined, {
                holds: [
                  { identity: 21, built: { kind: 'predicate' } },
                  { identity: 22, built: { kind: 'predicate' } },
                  { identity: 22, built: { kind: 'predicate' } },
                ],
              }),
              9,
            ),
            ...(imported ? [] : [{ name: 'not_yet', line: 30, doc: [], input_doc: [] }]),
          ]),
        ]),
      ])
    expect(lines(checks(reaching(true)))).toEqual([
      'business/things/command.ts:9  DOM-25  business/things/command/add_a_thing holds a predicate that no file exports: a component it reaches is exported, so that it has a path',
    ])
    expect(lines(checks(reaching(false)))).toEqual([])
  })

  it('stop on two ancestors with one name (DOM-25)', () => {
    expect(
      lines(
        checks(
          tree([
            folder('persona/member', [file('node', 'node', ['member'])]),
            folder('persona/member/shelf', [file('node', 'node', ['shelf'])]),
            folder('persona/member/shelf/member', [file('node', 'node', ['again'])]),
            folder('persona/member/shelf/member/leaf', [file('usecase', 'usecase')]),
          ]),
        ),
      ),
    ).toEqual([
      'persona/member/shelf/member/_door_below.ts:1  DOM-25  persona/member/shelf/member has the name of its ancestor persona/member: the scopes below it would carry both as _member',
    ])
  })

  it('stop on a past major of a domain with no version, or not below the current major (DOM-22)', () => {
    expect(
      lines(
        checks(
          tree([
            folder('business/things', [file('fact', 'fact'), version(2)]),
            folder('business/things/2', [file('fact', 'fact')]),
            folder('business/others', [file('fact', 'fact')]),
            folder('business/others/1', [file('fact', 'fact')]),
          ]),
        ),
      ),
    ).toEqual([
      'business/things/2/fact.ts:1  DOM-22  business/things/2 is a past major, and business/things is at major 2: a past major is below the current one',
      'business/others/1/fact.ts:1  DOM-22  business/others/1 is a past major of business/others, which declares no version: the majors of a domain are listed from its version',
    ])
  })

  it('stop on a folder with a node and a vocabulary that builds: a cycle of the layers (DOM-25)', () => {
    expect(
      lines(
        checks(
          tree([
            folder('persona/member', [
              file('value', 'value'),
              file('id', 'id'),
              file('node', 'node', ['member']),
              file('usecase', 'usecase'),
            ]),
          ]),
        ),
      ),
    ).toEqual([
      "persona/member/id.ts:1  DOM-25  persona/member holds a node and identities: their scope takes its builders from the point, which reads the node's context, and the node's scope gives them, a cycle of the layers",
    ])
  })

  it('stop on a folder below a domain whose parent holds no file (DOM-25)', () => {
    expect(
      lines(
        checks(
          tree([
            folder('business/things', [file('fact', 'fact')]),
            folder('business/things/shelf/one_thing', [file('command', 'command')]),
          ]),
        ),
      ),
    ).toEqual([
      'business/things/shelf/one_thing/command.ts:1  DOM-25  business/things/shelf/one_thing holds files, and business/things/shelf none: the doors and the registries carry a folder through its parent, so it would be in neither',
    ])
  })

  it('stop on a scope that would give two members under one name (DOM-25)', () => {
    const named = tree([
      folder('business/things', [file('id', 'id', ['thing_id'])]),
      folder('business/others', [file('things', 'value'), file('fact', 'fact')]),
    ])
    expect(lines(scopes(named).failures)).toEqual([
      'business/others/_scope_fact.ts:1  DOM-25  the scope of the facts of business/others would give two members named things, the file things.ts and the door of business/things: a scope gives each one name',
    ])
  })

  it('stop on a door that would expose two namespaces under one name (DOM-25)', () => {
    const named = tree([
      folder('business/things', [file('usecase', 'usecase', ['add_a_thing'])]),
      folder('business/things/usecase', [file('usecase', 'usecase', ['add_another'])]),
    ])
    expect(lines(doors(named).failures)).toEqual([
      'business/things/_door_persona.ts:1  DOM-25  the door of business/things to persona would expose two namespaces named usecase, its use cases and the folder business/things/usecase: a door gives each one name',
    ])
  })

  it('stop on a registry that would import two modules under one name (DOM-24)', () => {
    const named = tree([
      folder('business/things', [
        file('fact', 'fact', [exported('a_thing_has_been_added', component({ kind: 'fact' }))]),
      ]),
      folder('business/things/fact', [
        file('id', 'id', [exported('thing_id', component({ kind: 'id' }))]),
      ]),
    ])
    expect(lines(registries(named).failures)).toEqual([
      'business/things/_registry.ts:1  DOM-24  the registry of business/things would import two modules as fact, the twin _fact.ts and the registry of business/things/fact: a registry names each module once',
    ])
  })

  it('stop on a path a major was released with and its registry has not (DOM-22, DOM-24)', () => {
    expect(
      lines(
        forgotten(sound, [
          {
            domain: 'business/things',
            major: 1,
            paths: [
              'business/things/fact/a_thing_has_been_added',
              'business/things/fact/a_thing_has_been_booked',
            ],
          },
          {
            domain: 'business/things',
            major: 2,
            paths: ['business/things/id/thing_id', 'business/things/id/shelf_id'],
          },
          { domain: 'business/things', major: 0, paths: ['business/things/fact/an_old_one'] },
        ]),
      ),
    ).toEqual([
      'business/things/1/fact.ts:1  DOM-22  business/things/fact/a_thing_has_been_booked was released at things 1.x, and business/things/1 has it not: a past major keeps every component it was released with, written whole or delegated',
      'business/things/id.ts:1  DOM-24  business/things/id/shelf_id was released at things 2.x, and is no longer there: a path disappears only with a major, kept in its folder',
    ])
  })
})
