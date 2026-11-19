import { describe, expect, test } from 'vitest'
import { majors as loans_majors } from '../business/loans/_majors.ts'
import { majors as tools_majors } from '../business/tools/_majors.ts'
import { registry as loans_registry } from '../business/loans/_registry.ts'
import { oracle } from './oracle.ts'
import { kept_before_2_0_0, marta_s_loan_at_1, the_drill_added } from './kept.ts'

// SC-9: `business/loans/1/` deleted while a fact of 1.x is kept: the release
// stops at its start (DOM-22, PER-17, CFG-2). In February the folder of 1.x
// is deleted, while Marta's loan of 2 November and its waits are kept: the
// store gives the paths and versions it keeps (`StoredVersions`), and the
// versions of the store, composed at wiring, name each one no major reads.
// So the release does not start, rather than a stream in a loop, a wait
// stuck, a rebuild halfway. The same check stops a store whose domain's
// majors were not given, a current major that is not its `version.ts`'s, a
// minor newer than the release, and a builder that reads a domain absent.

/** `loans` with its folder of 1.x deleted. */
const loans_without_1 = { 2: loans_registry }

describe('SC-9, a past major deleted while the store keeps it', () => {
  test('the folder of 1.x deleted with a fact and waits of 1.x kept: the shed does not start', async () => {
    await expect(
      oracle({ kept: kept_before_2_0_0, majors: [loans_without_1, tools_majors] }),
    ).rejects.toThrow(
      [
        'the store keeps business/loans/fact/a_tool_has_been_lent at 1.4.0: business/loans keeps no folder of major 1: deleted while the store keeps it (DOM-22, D101)',
        'the store keeps business/loans/effect/wait_until_the_eve_of_the_due_date at 1.4.0: business/loans keeps no folder of major 1: deleted while the store keeps it (DOM-22, D101)',
        'the store keeps business/loans/effect/wait_until_the_due_date at 1.4.0: business/loans keeps no folder of major 1: deleted while the store keeps it (DOM-22, D101)',
      ].join('\n'),
    )
  })

  test('once the store keeps nothing of 1.x, the folder goes and the shed starts', async () => {
    const shed = await oracle({
      kept: { facts: [the_drill_added] },
      majors: [loans_without_1, tools_majors],
    })
    expect(shed.queued('business/loans/effect/wait_until_the_due_date')).toEqual([])
  })

  test('a domain whose majors the configurator did not give: the shed does not start', async () => {
    await expect(oracle({ kept: kept_before_2_0_0, majors: [loans_majors] })).rejects.toThrow(
      'the store keeps business/tools/fact/a_tool_has_been_added at 1.0.0: of no domain whose majors the store was given (DOM-22)',
    )
  })

  test("a current major that is not its version.ts's: the shed does not start", async () => {
    await expect(
      oracle({ majors: [{ 3: loans_registry, 1: loans_majors[1] }, tools_majors] }),
    ).rejects.toThrow(
      'business/loans is at 2.0.0 by its version.ts, and its majors give it as major 3: the current major is the one its version declares (DOM-22, CFG-2)',
    )
  })

  test('a store written by a newer release (2.1.0), met at 2.0.0: the shed does not start', async () => {
    const lent = marta_s_loan_at_1({
      lent: '2026-11-05T10:12:00-05:00',
      due: '2026-11-19T10:12:00-05:00',
    })
    const at_2_1 = {
      ...lent,
      parts: lent.parts.map((part) => ({ ...part, version: '2.1.0' as const })),
    }
    await expect(oracle({ kept: { facts: [the_drill_added, at_2_1] } })).rejects.toThrow(
      'the store keeps business/loans/fact/a_tool_has_been_lent at 2.1.0: newer than business/loans at 2.0.0: written by a newer release, the reader stops and retries (DOM-22)',
    )
  })

  test("the rebuild of the oracle, whose writes are loans' too, without loans' majors: the shed does not start", async () => {
    await expect(
      oracle({ kept: { facts: [the_drill_added] }, majors: [tools_majors] }),
    ).rejects.toThrow(
      /^the writes name business\/loans\/fact\/a_tool_has_been_lent, .*, of no domain whose majors the versions were given \(DOM-22, CFG-2\)$/,
    )
  })

  test("the ports of loans over versions without loans' majors: the shed does not start", async () => {
    await expect(oracle({ majors: [tools_majors] })).rejects.toThrow(
      /^the use cases record business\/loans\/fact\/a_tool_has_been_lent, business\/loans\/fact\/a_tool_has_been_lent_again, .*, of no domain whose majors the versions were given \(DOM-22, CFG-2\)$/,
    )
  })
})
