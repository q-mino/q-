// generated

// The identities of `tools`, branded with their path (DOM-24): the only
// module another domain may import (GR-3).

import { z } from 'zod'
import * as id from './id.ts'

/**
 * @see {@link id.tool_id}
 */
export const tool_id = id.tool_id.brand<'business/tools/id/tool_id'>()
export type tool_id = z.output<typeof tool_id>

/**
 * A stay of a tool in repair: the drill Marta returned damaged on Tuesday,
 * and again in December, Luigi's. Chosen by `tools` from the operation that
 * sends the tool to repair (D75.8, `identity_of`), whoever sends it.
 *
 * @see {@link id.repair_id}
 */
export const repair_id = id.repair_id.brand<'business/tools/id/repair_id'>()
export type repair_id = z.output<typeof repair_id>
