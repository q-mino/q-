// The relay's main on a disk of a test (REL-3, REL-6): its volume read from a
// JSON file the test writes (`Q_TEST_THE_DISK`), every deposit reading it
// again, so that the test fills the disk and frees it while the relay runs.
// The rest is the main's: its settings, its start, its stop at `SIGTERM`.
//
// Usage: node test/fixtures/a_relay_on_a_disk_of_a_file.ts

import { readFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import * as z from 'zod'
import { run } from '../../src/main.ts'

const a_volume = z.strictObject({
  bsize: z.number().int().positive(),
  blocks: z.number().int().nonnegative(),
  bavail: z.number().int().nonnegative(),
})

const the_disk = process.env['Q_TEST_THE_DISK']
if (the_disk === undefined) throw new Error('Q_TEST_THE_DISK: the file of the disk')

await run(process.env, {
  read_the_volume: async () => a_volume.parse(JSON.parse(await readFile(the_disk, 'utf8'))),
  monotonic: () => performance.now(),
  the_disk_is_read_again_after: 0,
})
