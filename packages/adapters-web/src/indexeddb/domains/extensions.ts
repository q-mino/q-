// The module of `extensions/activations` on IndexedDB (part 21.2): the
// oracle's (TST-2) over the node's database (WEB-8, WEB-9). The office's
// records in its store, each a value of the domain parsed when read: what
// the user did last of an extension (`['state', 'activation', name]`), an
// offer she withdrew (`['state', 'withdrawn_offer', name, bond]`, keyed by
// the pair, so that one extension's are one range), a question her node
// asked (`['state', 'question', question_id]`). Its predicates read those
// records, the address book's (`the_bond_exists`, GR-3: read, never written)
// and the manifests installed, the composition's, given as data (EXT-7); its
// writes set and delete the office's records alone (DOM-8); its reads join
// the manifests installed with what the user chose of each, in memory, as
// the oracle does (WEB-8). The meaning is the domain's `dsl` (DOM-5).

import * as zz from '@q-mino/domains/library'
import { registry } from '@q-mino/domains/extensions/activations/_registry.ts'
import { registry as address_book_registry } from '@q-mino/domains/bonds/address_book/_registry.ts'
import type * as activations_fact from '@q-mino/domains/extensions/activations/_fact.ts'
import type * as activations_predicate from '@q-mino/domains/extensions/activations/_predicate.ts'
import type * as activations_query from '@q-mino/domains/extensions/activations/_query.ts'
import type * as extension_selections from '@q-mino/domains/extensions/activations/_extension_selection.ts'
import type * as question_selections from '@q-mino/domains/extensions/activations/_question_selection.ts'
import type { question_id } from '@q-mino/domains/extensions/activations/_id.ts'
import type { bond_id } from '@q-mino/domains/bonds/address_book/_id.ts'
import { bond } from '@q-mino/domains/bonds/address_book/_value.ts'
import {
  activation,
  question,
  withdrawn_offer,
  type manifest,
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
import {
  execute_in,
  recorded_in,
  the_operators,
  type AKey,
  type ARange,
  type ARead,
  type Fragment,
  type Records,
  type Write,
} from '../command.ts'
import type { TheNodesStorage } from '../node.ts'
import {
  after,
  reads_in,
  selection_operators,
  type Field,
  type Selection,
  type Source,
} from '../reads.ts'
import {
  deleted,
  every_parsed,
  on_a_record,
  parsed,
  set,
  the_records_of_a_domain,
} from '../records.ts'
import { the_address_book_s_records } from './bonds.ts'

/** The office's records (WEB-8), in its store. */
const the_office_s_records = the_records_of_a_domain('extensions/activations')

/** What the user did last of an extension, by its name. */
const the_activation_of = (name: string): AKey => the_office_s_records.a('activation', name)

/** An offer the user withdrew: this extension, from this bond. */
const the_offer_withdrawn = (name: string, from: bond_id): AKey =>
  the_office_s_records.a('withdrawn_offer', name, from)

/** Every offer of an extension the user withdrew, one per bond. */
const the_offers_withdrawn_of = (name: string): ARange =>
  the_office_s_records.every('withdrawn_offer', name)

/** A question the node asked, by its identity. */
const the_question_of = (id: question_id): AKey => the_office_s_records.a('question', id)

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

/** The bonds the offer of an extension is withdrawn from, in the store's order. */
const withdrawn_from = (records: Records, name: string): readonly bond_id[] =>
  every_parsed(withdrawn_offer)(records, the_offers_withdrawn_of(name)).map((offer) => offer.bond)

/**
 * The installed extensions, each with what the user chose of it: the
 * composition's manifests, joined with the office's records, each
 * extension's activation and its withdrawn offers.
 */
const the_installed = (installed: readonly manifest[]): Source<AnInstalledExtension> => ({
  reads: installed.flatMap((its_manifest): readonly ARead[] => [
    the_activation_of(its_manifest.name),
    the_offers_withdrawn_of(its_manifest.name),
  ]),
  candidates: (records) =>
    installed.map((its_manifest) => ({
      manifest: its_manifest,
      activation: parsed(activation)(records.of(the_activation_of(its_manifest.name))),
      withdrawn_from: withdrawn_from(records, its_manifest.name),
    })),
})

/** An installed extension is offered to a bond (EXT-7): active, its offer not withdrawn from it. */
const is_offered_to =
  (to: bond_id) =>
  (extension: AnInstalledExtension): boolean =>
    the_extension_is_offered_to(
      to,
      the_state_of_an_extension(extension.manifest, extension.activation),
      extension.withdrawn_from,
    )

/** A fragment over the manifests installed alone, data given: it reads no record. */
const on_the_installed = (holds: () => boolean): Fragment => ({ reads: [], holds })

/**
 * The predicates' fragments (WEB-9), over the office's records, the address
 * book's (`the_bond_exists`, GR-3) and the manifests installed (EXT-7).
 */
const extensions_fragments = (
  installed: readonly manifest[],
): zz.PredicateFragments<zz.PredicatesIn<typeof activations_predicate>, Fragment> => ({
  'extensions/activations/predicate/the_extension_is_installed': (p) =>
    on_the_installed(() => installed.some((its_manifest) => its_manifest.name === p.name)),
  'extensions/activations/predicate/the_extension_is_installed_with_this_manifest': (p) =>
    on_the_installed(() =>
      installed.some((its_manifest) => the_same_manifest(its_manifest, p.manifest)),
    ),
  'extensions/activations/predicate/the_extension_is_activated': (p) =>
    on_a_record(activation)(the_activation_of(p.name), the_extension_is_activated),
  'extensions/activations/predicate/the_extension_is_activated_with_this_manifest': (p) =>
    on_a_record(activation)(the_activation_of(p.manifest.name), (its) =>
      the_extension_is_activated_with(p.manifest, its),
    ),
  'extensions/activations/predicate/the_bond_exists': (p) =>
    on_a_record(bond)(the_address_book_s_records.a('bond', p.bond), the_bond_is_kept),
  'extensions/activations/predicate/the_offer_is_withdrawn_from_the_bond': (p) => ({
    reads: [the_offers_withdrawn_of(p.name)],
    holds: (records) => the_offer_is_withdrawn_from(p.bond, withdrawn_from(records, p.name)),
  }),
  'extensions/activations/predicate/these_extensions_are_offered_to_the_bond': (p) => {
    const source = the_installed(installed)
    return {
      reads: source.reads,
      holds: (records) => {
        const extensions = source.candidates(records)
        return p.offered.every((offered) => {
          const extension = extensions.find((each) => each.manifest.name === offered.name)
          return (
            extension !== undefined &&
            is_offered_to(p.bond)(extension) &&
            the_same_majors(offered.majors, extension.manifest.majors.known)
          )
        })
      },
    }
  },
  'extensions/activations/predicate/a_question_has_this_id': (p) =>
    on_a_record(question)(the_question_of(p.question_id), a_question_is_there),
  'extensions/activations/predicate/the_question_waits': (p) =>
    on_a_record(question)(the_question_of(p.question_id), the_question_waits),
  'extensions/activations/predicate/the_extensions_in_common_came_back': (p) =>
    on_the_installed(() => the_extensions_in_common_came_back(p.what_came_back)),
})

// The reads of the subject `extensions/activations/selection/extension`: an installed extension.

const extension_selection: zz.Algebra<
  zz.SelectionsIn<typeof extension_selections>,
  Selection<AnInstalledExtension>
> = {
  ...selection_operators<AnInstalledExtension>(),
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

const extension_sources = (
  installed: readonly manifest[],
): {
  readonly an_extension: zz.QuerySource<
    zz.FieldsOf<typeof activations_query.an_extension>,
    Source<AnInstalledExtension>,
    Field<AnInstalledExtension>
  >
  readonly the_extensions_offered_to_a_bond: zz.QuerySource<
    zz.FieldsOf<typeof activations_query.the_extensions_offered_to_a_bond>,
    Source<AnInstalledExtension>,
    Field<AnInstalledExtension>
  >
  readonly the_extensions_in_common: zz.QuerySource<
    zz.FieldsOf<typeof activations_query.the_extensions_in_common>,
    Source<AnInstalledExtension>,
    Field<AnInstalledExtension>
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

const question_selection: zz.Algebra<
  zz.SelectionsIn<typeof question_selections>,
  Selection<question>
> = {
  ...selection_operators<question>(),
  predicate: {
    'extensions/activations/selection/question/the_question_was_asked_of_this_bond':
      (p) => () => (asked) =>
        asked.bond === p.bond,
  },
}

/** The questions her node asked, every one the office keeps, in the store's order. */
const the_questions: Source<question> = {
  reads: [the_office_s_records.every('question')],
  candidates: (records) => every_parsed(question)(records, the_office_s_records.every('question')),
}

const question_sources: {
  readonly the_questions_asked_of_a_bond: zz.QuerySource<
    zz.FieldsOf<typeof activations_query.the_questions_asked_of_a_bond>,
    Source<question>,
    Field<question>
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

/** A write of the office's records that reads none. */
const putting = (puts: Write['puts']): Write => ({ reads: [], puts })

/**
 * A question after a fact's change, parsed as a question of the office, so
 * that a fact that leaves a question in no state of the domain's fails the
 * command (an interpreter rule, as the oracle's); none where the question is
 * not in the record.
 */
const with_the_question = (id: question_id, progress: question['progress']): Write => {
  const key = the_question_of(id)
  return {
    reads: [key],
    puts: (records) => {
      const before = parsed(question)(records.of(key))
      return before === undefined ? [] : [set(key, question.parse({ ...before, progress }))]
    },
  }
}

/** A fact that changes nothing (DOM-6). */
const nothing: Write = putting(() => [])

const extensions_writes: zz.FactWrites<zz.FactsIn<typeof activations_fact>, Write> = {
  'extensions/activations/fact/an_extension_has_been_activated': ({ activated_extension }) =>
    putting(() => [set(the_activation_of(activated_extension.name), activated_extension)]),
  'extensions/activations/fact/an_extension_has_been_activated_again': () => nothing,
  'extensions/activations/fact/an_extension_has_been_deactivated': ({ deactivated_extension }) =>
    putting(() => [set(the_activation_of(deactivated_extension.name), deactivated_extension)]),
  'extensions/activations/fact/an_extension_has_been_deactivated_again': () => nothing,
  'extensions/activations/fact/the_offer_of_an_extension_has_been_withdrawn_from_a_bond': ({
    withdrawn_offer: withdrawn,
  }) => putting(() => [set(the_offer_withdrawn(withdrawn.name, withdrawn.bond), withdrawn)]),
  'extensions/activations/fact/the_offer_of_an_extension_has_been_withdrawn_from_a_bond_again':
    () => nothing,
  'extensions/activations/fact/an_extension_has_been_offered_to_a_bond': ({ name, bond: to }) =>
    putting(() => [deleted(the_offer_withdrawn(name, to))]),
  'extensions/activations/fact/an_extension_has_been_offered_to_a_bond_again': () => nothing,
  'extensions/activations/fact/a_bond_has_been_asked_for_the_extensions_in_common': ({
    question: asked,
  }) => putting(() => [set(the_question_of(asked.id), question.parse(asked))]),
  'extensions/activations/fact/the_extensions_in_common_with_a_bond_have_been_learned': ({
    question_id,
    in_common,
  }) => with_the_question(question_id, { stage: 'learned', in_common }),
  'extensions/activations/fact/a_question_about_the_extensions_in_common_had_no_answer': ({
    question_id,
    why,
  }) => with_the_question(question_id, { stage: 'had_no_answer', why }),
}

/** The command use cases of `activations`: the user's (`self`, steps 13 and 15) and the executor's (DOM-14). */
const extensions_command_use_cases = {
  activate_an_extension,
  deactivate_an_extension,
  withdraw_the_offer_from_a_bond,
  offer_an_extension_to_a_bond,
  ask_a_bond_for_the_extensions_in_common,
  learn_the_extensions_in_common,
}

/**
 * The ports of `extensions/activations` on IndexedDB, the oracle's
 * (`extensions_ports`, TST-2) over the office's store: its commands, one
 * transaction each (WEB-9), and its reads of the installed extensions, one
 * snapshot each, given the manifests installed (the composition's, in the
 * office's words). A fact's bond is an identity of the address book's, a
 * resource of the fact (DOM-10): its registry names it (`identities`). No
 * read streams, as the oracle's.
 */
export const extensions_ports_on_indexeddb =
  (node: Pick<TheNodesStorage, 'domain'>, installed: readonly manifest[]) =>
  (versions: zz.Versions) => {
    const storage = node.domain('extensions/activations')
    const reads = reads_in(storage)
    return {
      ...zz.command_use_case_ports({
        registry,
        identities: address_book_registry,
        versions,
        use_cases: extensions_command_use_cases,
      })({
        algebra: { predicate: extensions_fragments(installed), ...the_operators },
        write: extensions_writes,
        execute: execute_in(storage),
        recorded: recorded_in(storage),
      }),
      ...zz.read_use_case_ports({
        registry,
        identities: address_book_registry,
        versions,
        use_cases: { an_extension, the_extensions_offered_to_a_bond, the_extensions_in_common },
      })({
        algebra: { ...extension_selection, after },
        sources: extension_sources(installed),
        read: reads.read,
        page: reads.page,
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
        read: reads.read,
        page: reads.page,
        streams: {},
      }),
    }
  }
