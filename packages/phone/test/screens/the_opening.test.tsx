// The screens' opening when her node's reads fail (WEB-18, WEB-8): the fault
// told, never an endless «Apro Cumino…»; a record out of its form (as the
// build of 22 Nov 2026 kept her face, its instant with an offset) told as the
// data of an older test release, with the gesture to clear them where the
// composition root gives it (the test channel), and without it elsewhere.

import { ARecordOutOfItsForm } from '@q-mino/adapters-web'
import * as zz from '@q-mino/domains/library'
import { afterEach, describe, expect, test } from 'vitest'
import {
  a_device_of_test,
  a_node_of_test,
  has_a_button,
  opens_the_app,
  texts,
  the_button,
  until,
  type TheAppOpened,
} from './harness.tsx'

const words = texts.screens.common
let opened: TheAppOpened | undefined
afterEach(() => {
  opened?.closes()
  opened = undefined
})

/** The fault of a record kept with an instant the old build wrote, read under `date_time` with `Z` only. */
const a_record_out_of_its_form = (): ARecordOutOfItsForm => {
  const read = zz.date_time.safeParse('2026-11-22T10:00:00.000+01:00')
  if (read.success) throw new Error('the instant with an offset reads')
  return new ARecordOutOfItsForm(read.error)
}

/** Her node, whose face she acts as does not read. */
const a_node_whose_reads_fail = (fault: Error) => {
  const anna = a_node_of_test()
  return { ...anna.node, the_active_face: () => Promise.reject(fault) }
}

/** The fault told, once the screens have read her node. */
const the_fault = (app: TheAppOpened): HTMLElement => {
  const shown = app.root.querySelector<HTMLElement>('main > section[role="alert"]')
  if (shown === null) throw new Error('no fault told')
  return shown
}

describe('the opening that fails', () => {
  test('a record out of its form: the data of an older test release told, and the gesture to clear them', async () => {
    let cleared = 0
    const fault = a_record_out_of_its_form()
    opened = opens_the_app({
      node: a_node_whose_reads_fail(fault),
      device: a_device_of_test([]),
      clears_the_data_and_starts_again: () => {
        cleared += 1
      },
    })
    const app = opened
    await until(() => {
      expect(the_fault(app).querySelector('h1')?.textContent).toBe(words.it_does_not_start)
    })
    expect(app.root.textContent).not.toContain(words.opening)
    expect(the_fault(app).textContent).toContain(words.the_data_of_an_older_test_release)
    expect(the_fault(app).querySelector('pre')?.textContent).toBe(fault.message)
    the_button(the_fault(app), words.clear_the_data_and_start_again).click()
    expect(cleared).toBe(1)
  })

  test('without the gesture (the release channel): the data told, no button', async () => {
    opened = opens_the_app({
      node: a_node_whose_reads_fail(a_record_out_of_its_form()),
      device: a_device_of_test([]),
    })
    const app = opened
    await until(() => {
      expect(the_fault(app).textContent).toContain(words.the_data_of_an_older_test_release)
    })
    expect(has_a_button(the_fault(app), words.clear_the_data_and_start_again)).toBe(false)
  })

  test('another fault: the start does not start, and why, with nothing to clear', async () => {
    opened = opens_the_app({
      node: a_node_whose_reads_fail(new Error('the database is gone')),
      device: a_device_of_test([]),
      clears_the_data_and_starts_again: () => undefined,
    })
    const app = opened
    await until(() => {
      expect(the_fault(app).querySelector('pre')?.textContent).toBe('the database is gone')
    })
    expect(the_fault(app).textContent).not.toContain(words.the_data_of_an_older_test_release)
    expect(has_a_button(the_fault(app), words.clear_the_data_and_start_again)).toBe(false)
  })
})
