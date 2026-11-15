// generated

// The here of the node of `member` (DOM-25): the builder of the node, bound to
// the context of the point above it, the one the node of the persona base
// gives; the components below. The folders it sees (`sight.ts`): `tools`
// (usecase, id, fact), `loans` (usecase, id, fact), `accounts` (lookup, id).

import * as wlib from '../../wlib.ts'
import type { persona_context } from '../_node.ts'
import * as tools_usecase from '../../@business/@tools/_usecase.ts'
import * as tools_id from '../../@business/@tools/_id.ts'
import * as tools_fact from '../../@business/@tools/_fact.ts'
import * as loans_usecase from '../../@business/@loans/_usecase.ts'
import * as loans_id from '../../@business/@loans/_id.ts'
import * as loans_fact from '../../@business/@loans/_fact.ts'
import * as accounts_lookup from '../../@auth/@accounts/_lookup.ts'
import * as accounts_id from '../../@auth/@accounts/_id.ts'
export * as value from './_value.ts'
export * as dsl from './_dsl.ts'

export const { node } = wlib.builders_at<persona_context>()
export const tools = { usecase: tools_usecase, id: tools_id, fact: tools_fact }
export const loans = { usecase: loans_usecase, id: loans_id, fact: loans_fact }
export const accounts = { lookup: accounts_lookup, id: accounts_id }
