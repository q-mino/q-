// The module of `extensions` in q-'s oracle (TST-2, MBX-7): the state of
// `extensions/activations`, the user's choices about the extensions and her
// node's questions about the extensions in common; its predicates and
// selections as functions of that state, of the address book's beside it
// in the phone's cell (GR-3: `the_bond_exists` reads the address book in
// the same step) and of the manifests installed, the composition's, given
// as data (EXT-7); its sources and its writes, the meaning from the
// domain's `dsl` (DOM-5); and the domain's command and read ports over a
// cell (part 12.4). On the model of `bonds.ts` and `post.ts`.

import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/extensions/activations/_registry.ts'
import { registry as address_book_registry } from '@q-mino/domains/bonds/address_book/_registry.ts'
import type * as activations_fact from '@q-mino/domains/extensions/activations/_fact.ts'
import type * as activations_predicate from '@q-mino/domains/extensions/activations/_predicate.ts'
import type * as activations_query from '@q-mino/domains/extensions/activations/_query.ts'
import type * as extension_selections from '@q-mino/domains/extensions/activations/_extension_selection.ts'
import type * as question_selections from '@q-mino/domains/extensions/activations/_question_selection.ts'
import type { extension_name, question_id } from '@q-mino/domains/extensions/activations/_id.ts'
import type { bond_id } from '@q-mino/domains/bonds/address_book/_id.ts'
import {
  question,
  type activation,
  type manifest,
  type withdrawn_offer,
} from '@q-mino/domains/extensions/activations/_value.ts'
import {
  a_question_is_there,
  the_extension_is_activated,
  the_extension_is_activated_with,
  the_extension_is_offered_to,
  the_extensions_in_common_came_back,
  the_offer_is_withdrawn_from,
  the_question_waits,
  the_same_majors,
  the_same_manifest,
  the_state_of_an_extension,
} from '@q-mino/domains/extensions/activations/_dsl.ts'
import {
  activate_an_extension,
  an_extension,
  ask_a_bond_for_the_extensions_in_common,
  deactivate_an_extension,
  learn_the_extensions_in_common,
  offer_an_extension_to_a_bond,
  the_extensions_in_common,
  the_extensions_offered_to_a_bond,
  the_questions_asked_of_a_bond,
  withdraw_the_offer_from_a_bond,
} from '@q-mino/domains/extensions/activations/_usecase.ts'
import { the_bond_is_kept } from '@q-mino/domains/bonds/address_book/_dsl.ts'
import type { BondsState } from './bonds.ts'
import type { CommandCell, ReadCell } from './cell.ts'
import {
  after,
  algebra,
  execute,
  page,
  read,
  recorded,
  selection_operators,
  type Field,
  type Selection,
  type Source,
} from './interpreter.ts'

/**
 * The extensions' office (EXT-7, EXT-8), under the domain's name, so that it
 * sits beside the address book in a phone's cell: what the user did last of
 * each extension, by its name; the offers she withdrew, each an extension
 * from a bond; the questions her node asked, by their identity.
 */
export interface ExtensionsState {
  readonly activations: {
    readonly by_extension: ReadonlyMap<extension_name, activation>
    readonly withdrawn_offers: readonly withdrawn_offer[]
    readonly questions: ReadonlyMap<question_id, question>
  }
}

/** An office that holds nothing yet: a phone before its user chose anything, every extension off. */
export const no_activation: ExtensionsState = {
  activations: { by_extension: new Map(), withdrawn_offers: [], questions: new Map() },
}

/** What the module reads: its own state and the address book's, in one cell (GR-3). */
type Read = ExtensionsState & BondsState

/**
 * An installed extension, as the subject `extension` reads it (EXT-7): its
 * manifest as installed, what the user did last of it, and the bonds she
 * withdrew its offer from.
 */
export interface AnInstalledExtension {
  readonly manifest: manifest
  readonly activation: activation | undefined
  readonly withdrawn_from: readonly bond_id[]
}

/** The bonds the offer of an extension is withdrawn from. */
const withdrawn_from = (state: ExtensionsState, name: string): readonly bond_id[] =>
  state.activations.withdrawn_offers
    .filter((offer) => offer.name === name)
    .map((offer) => offer.bond)

/** The installed extensions, each with what the user chose of it: the composition's manifests, joined with the office's state. */
const the_installed =
  (installed: readonly manifest[]): Source<Read, AnInstalledExtension> =>
  (state) =>
    installed.map((its_manifest) => ({
      manifest: its_manifest,
      activation: state.activations.by_extension.get(its_manifest.name),
      withdrawn_from: withdrawn_from(state, its_manifest.name),
    }))

/** An installed extension is offered to a bond (EXT-7): active, its offer not withdrawn from it. */
const is_offered_to =
  (bond: bond_id) =>
  (extension: AnInstalledExtension): boolean =>
    the_extension_is_offered_to(
      bond,
      the_state_of_an_extension(extension.manifest, extension.activation),
      extension.withdrawn_from,
    )

const the_question = (state: ExtensionsState, id: question_id): question | undefined =>
  state.activations.questions.get(id)

/**
 * The predicates' fragments (TST-2), over the office's state, the address
 * book's (`the_bond_exists`, GR-3) and the manifests installed (EXT-7).
 */
export const extensions_fragments = (
  installed: readonly manifest[],
): zz.PredicateFragments<
  zz.PredicatesIn<typeof activations_predicate>,
  (state: Read) => boolean
> => ({
  'extensions/activations/predicate/the_extension_is_installed': (p) => () =>
    installed.some((its_manifest) => its_manifest.name === p.name),
  'extensions/activations/predicate/the_extension_is_installed_with_this_manifest': (p) => () =>
    installed.some((its_manifest) => the_same_manifest(its_manifest, p.manifest)),
  'extensions/activations/predicate/the_extension_is_activated': (p) => (state) =>
    the_extension_is_activated(state.activations.by_extension.get(p.name)),
  'extensions/activations/predicate/the_extension_is_activated_with_this_manifest':
    (p) => (state) =>
      the_extension_is_activated_with(
        p.manifest,
        state.activations.by_extension.get(p.manifest.name),
      ),
  'extensions/activations/predicate/the_bond_exists': (p) => (state) =>
    the_bond_is_kept(state.address_book.bonds.get(p.bond)),
  'extensions/activations/predicate/the_offer_is_withdrawn_from_the_bond': (p) => (state) =>
    the_offer_is_withdrawn_from(p.bond, withdrawn_from(state, p.name)),
  'extensions/activations/predicate/these_extensions_are_offered_to_the_bond': (p) => (state) => {
    const extensions = the_installed(installed)(state)
    return p.offered.every((offered) => {
      const extension = extensions.find((each) => each.manifest.name === offered.name)
      return (
        extension !== undefined &&
        is_offered_to(p.bond)(extension) &&
        the_same_majors(offered.majors, extension.manifest.majors.known)
      )
    })
  },
  'extensions/activations/predicate/a_question_has_this_id': (p) => (state) =>
    a_question_is_there(the_question(state, p.question_id)),
  'extensions/activations/predicate/the_question_waits': (p) => (state) =>
    the_question_waits(the_question(state, p.question_id)),
  'extensions/activations/predicate/the_extensions_in_common_came_back': (p) => () =>
    the_extensions_in_common_came_back(p.what_came_back),
})

// The reads of the subject `extensions/activations/selection/extension`: an installed extension.

export const extension_selection: zz.Algebra<
  zz.SelectionsIn<typeof extension_selections>,
  Selection<Read, AnInstalledExtension>
> = {
  ...selection_operators<Read, AnInstalledExtension>(),
  predicate: {
    'extensions/activations/selection/extension/the_extension_has_this_name':
      (p) => () => (extension) =>
        extension.manifest.name === p.name,
    'extensions/activations/selection/extension/the_extension_is_offered_to_this_bond':
      (p) => () => (extension) =>
        is_offered_to(p.bond)(extension),
    'extensions/activations/selection/extension/the_extension_is_one_of_these':
      (p) => () => (extension) =>
        p.names.includes(extension.manifest.name),
  },
}

/** An extension as one side offers it (EXT-8): its name, and the majors its surface on `known` serves. */
const as_offered = {
  name: () => (extension: AnInstalledExtension) => extension.manifest.name,
  majors: () => (extension: AnInstalledExtension) => extension.manifest.majors.known,
}

export const extension_sources = (
  installed: readonly manifest[],
): {
  readonly an_extension: zz.QuerySource<
    zz.FieldsOf<typeof activations_query.an_extension>,
    Source<Read, AnInstalledExtension>,
    Field<Read, AnInstalledExtension>
  >
  readonly the_extensions_offered_to_a_bond: zz.QuerySource<
    zz.FieldsOf<typeof activations_query.the_extensions_offered_to_a_bond>,
    Source<Read, AnInstalledExtension>,
    Field<Read, AnInstalledExtension>
  >
  readonly the_extensions_in_common: zz.QuerySource<
    zz.FieldsOf<typeof activations_query.the_extensions_in_common>,
    Source<Read, AnInstalledExtension>,
    Field<Read, AnInstalledExtension>
  >
} => ({
  an_extension: {
    from: the_installed(installed),
    fields: {
      name: () => (extension) => extension.manifest.name,
      manifest: () => (extension) => extension.manifest,
      state: () => (extension) =>
        the_state_of_an_extension(extension.manifest, extension.activation),
    },
  },
  the_extensions_offered_to_a_bond: { from: the_installed(installed), fields: as_offered },
  the_extensions_in_common: { from: the_installed(installed), fields: as_offered },
})

// The reads of the subject `extensions/activations/selection/question`: a question the node asked a bond.

export const question_selection: zz.Algebra<
  zz.SelectionsIn<typeof question_selections>,
  Selection<Read, question>
> = {
  ...selection_operators<Read, question>(),
  predicate: {
    'extensions/activations/selection/question/the_question_was_asked_of_this_bond':
      (p) => () => (asked) =>
        asked.bond === p.bond,
  },
}

/** The questions her node asked, every one the office keeps. */
const the_questions: Source<Read, question> = (state) => [...state.activations.questions.values()]

export const question_sources: {
  readonly the_questions_asked_of_a_bond: zz.QuerySource<
    zz.FieldsOf<typeof activations_query.the_questions_asked_of_a_bond>,
    Source<Read, question>,
    Field<Read, question>
  >
} = {
  the_questions_asked_of_a_bond: {
    from: the_questions,
    fields: {
      id: () => (asked) => asked.id,
      bond: () => (asked) => asked.bond,
      offered: () => (asked) => asked.offered,
      asked_at: () => (asked) => asked.asked_at,
      progress: () => (asked) => asked.progress,
    },
  },
}

/** The office after a change of its record. */
const with_the_office =
  (change: (office: ExtensionsState['activations']) => Partial<ExtensionsState['activations']>) =>
  (state: Read): Partial<Read> => ({
    activations: { ...state.activations, ...change(state.activations) },
  })

/**
 * A question after a fact's change, parsed as a question of the office, so
 * that a fact that leaves a question in no state of the domain's fails the
 * story (an interpreter rule, as `bonds.ts`).
 */
const with_the_question = (id: question_id, progress: question['progress']) =>
  with_the_office((office) => {
    const before = office.questions.get(id)
    return before === undefined
      ? {}
      : { questions: new Map(office.questions).set(id, question.parse({ ...before, progress })) }
  })

/** A fact that changes nothing (DOM-6). */
const nothing = (): Partial<Read> => ({})

export const extensions_writes: zz.FactWrites<
  zz.FactsIn<typeof activations_fact>,
  (state: Read) => Partial<Read>
> = {
  'extensions/activations/fact/an_extension_has_been_activated': ({ activated_extension }) =>
    with_the_office((office) => ({
      by_extension: new Map(office.by_extension).set(activated_extension.name, activated_extension),
    })),
  'extensions/activations/fact/an_extension_has_been_activated_again': () => nothing,
  'extensions/activations/fact/an_extension_has_been_deactivated': ({ deactivated_extension }) =>
    with_the_office((office) => ({
      by_extension: new Map(office.by_extension).set(
        deactivated_extension.name,
        deactivated_extension,
      ),
    })),
  'extensions/activations/fact/an_extension_has_been_deactivated_again': () => nothing,
  'extensions/activations/fact/the_offer_of_an_extension_has_been_withdrawn_from_a_bond': ({
    withdrawn_offer,
  }) =>
    with_the_office((office) => ({
      withdrawn_offers: [...office.withdrawn_offers, withdrawn_offer],
    })),
  'extensions/activations/fact/the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again':
    () => nothing,
  'extensions/activations/fact/an_extension_has_been_offered_to_a_bond': ({ name, bond }) =>
    with_the_office((office) => ({
      withdrawn_offers: office.withdrawn_offers.filter(
        (offer) => !(offer.name === name && offer.bond === bond),
      ),
    })),
  'extensions/activations/fact/an_extension_has_been_offered_to_a_bond_again': () => nothing,
  'extensions/activations/fact/a_bond_has_been_asked_for_the_extensions_in_common': ({
    question: asked,
  }) =>
    with_the_office((office) => ({
      questions: new Map(office.questions).set(asked.id, question.parse(asked)),
    })),
  'extensions/activations/fact/the_extensions_in_common_with_a_bond_have_been_learned': ({
    question_id,
    in_common,
  }) => with_the_question(question_id, { stage: 'learned', in_common }),
  'extensions/activations/fact/a_question_about_the_extensions_in_common_had_no_answer': ({
    question_id,
    why,
  }) => with_the_question(question_id, { stage: 'had_no_answer', why }),
}

/** The command use cases of `activations`, whose ports the oracle builds: the user's (`self`, steps 13 and 15) and the executor's (DOM-14). */
export const extensions_command_use_cases = {
  activate_an_extension,
  deactivate_an_extension,
  withdraw_the_offer_from_a_bond,
  offer_an_extension_to_a_bond,
  ask_a_bond_for_the_extensions_in_common,
  learn_the_extensions_in_common,
}

/** The oracle's state adapter for the commands of `activations` (TST-2): fragments, writes, the execution. */
export const extensions_command_adapter = (
  cell: CommandCell<Read>,
  installed: readonly manifest[],
) => {
  const fragments = extensions_fragments(installed)
  return {
    algebra: algebra<Read, typeof fragments>(fragments),
    write: extensions_writes,
    execute: execute(cell),
    recorded: recorded(cell),
  }
}

/**
 * The ports of `extensions/activations` over the oracle (TST-2): its
 * commands, and its reads of the installed extensions, given the manifests
 * installed (the composition's, in the office's words: the kernel's adapter
 * translates them, `the_manifest_to_accept`). A fact's bond is an identity
 * of the address book's, a resource of the fact (DOM-10): its registry
 * names it (`identities`). No read streams: the screens of steps 15 and 16
 * ask for them when they need them.
 */
export const extensions_ports =
  (cell: CommandCell<Read> & ReadCell<Read>, installed: readonly manifest[]) =>
  (versions: zz.Versions) => ({
    ...zz.command_use_case_ports({
      registry,
      identities: address_book_registry,
      versions,
      use_cases: extensions_command_use_cases,
    })(extensions_command_adapter(cell, installed)),
    ...zz.read_use_case_ports({
      registry,
      identities: address_book_registry,
      versions,
      use_cases: { an_extension, the_extensions_offered_to_a_bond, the_extensions_in_common },
    })({
      algebra: { ...extension_selection, after },
      sources: extension_sources(installed),
      read: read(cell),
      page: page(cell),
      streams: {},
    }),
    ...zz.read_use_case_ports({
      registry,
      identities: address_book_registry,
      versions,
      use_cases: { the_questions_asked_of_a_bond },
    })({
      algebra: { ...question_selection, after },
      sources: question_sources,
      read: read(cell),
      page: page(cell),
      streams: {},
    }),
  })
