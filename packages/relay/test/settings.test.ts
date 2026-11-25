import { describe, expect, test } from 'vitest'
import { the_settings_of } from '../src/settings.ts'

// The relay's settings from its environment (REL-1): the defaults, the
// database in systemd's state directory, and the faults of those out of form.

describe("the relay's settings (REL-1)", () => {
  test('the defaults: port 8080, the greater of 1 GiB and a tenth of the disk kept free', () => {
    expect(the_settings_of({ CUMINO_RELAY_DATABASE: '/srv/relay.sqlite' })).toEqual({
      read: 'settings',
      settings: {
        port: 8080,
        database: '/srv/relay.sqlite',
        kept_free: { bytes: 1024 ** 3, percent: 10 },
      },
    })
  })

  test("the database in the first of systemd's state directories, unless it is named", () => {
    const read = the_settings_of({
      STATE_DIRECTORY: '/var/lib/cumino-relay:/var/lib/other',
      CUMINO_RELAY_PORT: '7070',
      CUMINO_RELAY_KEEP_FREE_BYTES: '0',
      CUMINO_RELAY_KEEP_FREE_PERCENT: '5',
    })
    expect(read).toEqual({
      read: 'settings',
      settings: {
        port: 7070,
        database: '/var/lib/cumino-relay/relay.sqlite',
        kept_free: { bytes: 0, percent: 5 },
      },
    })
    expect(
      the_settings_of({ STATE_DIRECTORY: '/var/lib/cumino-relay', CUMINO_RELAY_DATABASE: '/x.db' }),
    ).toMatchObject({ settings: { database: '/x.db' } })
  })

  test('a setting out of form, or no database, is a fault', () => {
    for (const [environment, fault] of [
      [{ CUMINO_RELAY_PORT: '70000', CUMINO_RELAY_DATABASE: '/x' }, /^CUMINO_RELAY_PORT/],
      [{ CUMINO_RELAY_PORT: '-1', CUMINO_RELAY_DATABASE: '/x' }, /^CUMINO_RELAY_PORT/],
      [{ CUMINO_RELAY_KEEP_FREE_PERCENT: '101', CUMINO_RELAY_DATABASE: '/x' }, /PERCENT/],
      [{ CUMINO_RELAY_KEEP_FREE_BYTES: '1e9', CUMINO_RELAY_DATABASE: '/x' }, /BYTES/],
      [{ STATE_DIRECTORY: '' }, /^CUMINO_RELAY_DATABASE: no database/],
      [{}, /^CUMINO_RELAY_DATABASE: no database/],
    ] as const) {
      const read = the_settings_of(environment)
      if (read.read !== 'faults') throw new Error(`${JSON.stringify(environment)} read as settings`)
      expect(read.faults.join('\n')).toMatch(fault)
    }
  })
})
