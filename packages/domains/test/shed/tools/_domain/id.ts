// generated

// The identities of `tools`, branded with their path (DOM-24): the only
// module another domain may import (GR-3).

import { z } from 'zod'
import * as id from './_id.ts'

/**
 * @see {@link id.tool_id}
 */
export const tool_id = id.tool_id.brand<'tools/id/tool_id'>()
export type tool_id = z.output<typeof tool_id>
