import { describe, expect, test } from 'vitest'
import {
  open_a_camera,
  the_camera,
  the_constraints_of,
  why_not_on,
  type AFacing,
  type TheMediaDevices,
} from '../../src/index.ts'

// The camera (WEB-2): what the browser is asked for, facing the user or away
// from her; its refusals as outcomes; the device's cameras counted; one camera
// at a time, the one before turned off first. The stream played and looked
// through is the browser's, proved on the phones (step 27): Node has no
// camera, so the browser's media devices are fakes of the parts used (WEB-5).

/** A stream of test: its one track, which tells the log when it stops. */
interface AStreamOfTest {
  readonly getTracks: () => readonly { readonly stop: () => void }[]
}

/** Media devices of test: each stream asked for logged with where it faces, each track stopped too. */
const media_devices_of_test = (
  video_inputs: number,
): {
  readonly media_devices: TheMediaDevices<AStreamOfTest>
  readonly log: () => readonly string[]
  readonly asked: () => readonly MediaStreamConstraints[]
} => {
  let log: readonly string[] = []
  let asked: readonly MediaStreamConstraints[] = []
  let streams = 0
  return {
    media_devices: {
      getUserMedia: (constraints) => {
        asked = [...asked, constraints]
        const video = constraints.video
        const facing =
          typeof video === 'object' && typeof video.facingMode === 'object'
            ? JSON.stringify(video.facingMode)
            : 'anywhere'
        streams += 1
        const stream = streams
        log = [...log, `asked ${String(stream)} facing ${facing}`]
        return Promise.resolve({
          getTracks: () => [
            {
              stop: () => {
                log = [...log, `stopped ${String(stream)}`]
              },
            },
          ],
        })
      },
      enumerateDevices: () =>
        Promise.resolve([
          { kind: 'audioinput' },
          ...Array.from({ length: video_inputs }, () => ({ kind: 'videoinput' })),
        ]),
    },
    log: () => log,
    asked: () => asked,
  }
}

describe('a camera', () => {
  test('is asked for as video only, facing where it is asked, where there is such a camera', async () => {
    const device = media_devices_of_test(2)
    for (const facing of ['user', 'environment'] as const satisfies readonly AFacing[])
      await open_a_camera(device.media_devices, facing)
    expect(device.asked()).toEqual([the_constraints_of('user'), the_constraints_of('environment')])
    expect(the_constraints_of('user')).toEqual({
      audio: false,
      video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    })
    expect(the_constraints_of('environment')).toEqual({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
  })

  test("counts the device's cameras by its video inputs, once open; one when the browser does not tell", async () => {
    const cameras = async (media_devices: TheMediaDevices<AStreamOfTest>) => {
      const opened = await open_a_camera(media_devices, 'user')
      return opened.is === 'open' ? opened.cameras : opened.is
    }
    expect(await cameras(media_devices_of_test(1).media_devices)).toBe('one')
    expect(await cameras(media_devices_of_test(2).media_devices)).toBe('more_than_one')
    const not_told = media_devices_of_test(2).media_devices
    expect(
      await cameras({
        getUserMedia: not_told.getUserMedia,
        enumerateDevices: () => Promise.reject(new DOMException('not told', 'NotAllowedError')),
      }),
    ).toBe('one')
  })

  test('turned off, its tracks stop, once', async () => {
    const device = media_devices_of_test(1)
    const opened = await open_a_camera(device.media_devices, 'user')
    if (opened.is !== 'open') throw new Error(`the camera is ${opened.is}`)
    expect(opened.is_off()).toBe(false)
    opened.turn_off()
    opened.turn_off()
    expect(opened.is_off()).toBe(true)
    expect(device.log()).toEqual(['asked 1 facing {"ideal":"user"}', 'stopped 1'])
  })

  test('is not on when the browser refuses it, and says why', async () => {
    const refusing = (name: string): TheMediaDevices<AStreamOfTest> => ({
      getUserMedia: () => Promise.reject(new DOMException(`refused: ${name}`, name)),
      enumerateDevices: () => Promise.resolve([]),
    })
    const outcomes = await Promise.all(
      [
        'NotAllowedError',
        'SecurityError',
        'NotFoundError',
        'OverconstrainedError',
        'NotReadableError',
        'AbortError',
      ].map(async (name) => (await open_a_camera(refusing(name), 'user')).is),
    )
    expect(outcomes).toEqual(['refused', 'refused', 'missing', 'missing', 'busy', 'busy'])
  })

  test('is busy for a refusal the browser does not name', () => {
    expect(why_not_on(new Error('the camera fell'))).toBe('busy')
    expect(why_not_on('a thrown string')).toBe('busy')
  })
})

describe("the device's camera", () => {
  test('turned to the other side, turns off the camera before (its tracks stopped) before the new one is asked for', async () => {
    const device = media_devices_of_test(2)
    const camera = the_camera(device.media_devices)
    const front = await camera('user')
    const rear = await camera('environment')
    const front_again = await camera('user')
    expect(device.log()).toEqual([
      'asked 1 facing {"ideal":"user"}',
      'stopped 1',
      'asked 2 facing {"ideal":"environment"}',
      'stopped 2',
      'asked 3 facing {"ideal":"user"}',
    ])
    expect([front, rear, front_again].map((one) => one.is === 'open' && one.is_off())).toEqual([
      true,
      true,
      false,
    ])
  })

  test('turned while the one before is still opening, waits for it and turns it off first', async () => {
    const device = media_devices_of_test(2)
    const camera = the_camera(device.media_devices)
    const [front, rear] = await Promise.all([camera('user'), camera('environment')])
    expect(device.log()).toEqual([
      'asked 1 facing {"ideal":"user"}',
      'stopped 1',
      'asked 2 facing {"ideal":"environment"}',
    ])
    expect(front.is === 'open' && front.is_off()).toBe(true)
    expect(rear.is === 'open' && rear.is_off()).toBe(false)
  })

  test('a camera before that did not open has nothing to turn off', async () => {
    let answers: readonly ('refuse' | 'open')[] = ['refuse', 'open']
    const opened = media_devices_of_test(1).media_devices
    const camera = the_camera<AStreamOfTest>({
      getUserMedia: (constraints) => {
        const [answer, ...rest] = answers
        answers = rest
        return answer === 'refuse'
          ? Promise.reject(new DOMException('refused', 'NotAllowedError'))
          : opened.getUserMedia(constraints)
      },
      enumerateDevices: opened.enumerateDevices,
    })
    expect((await camera('user')).is).toBe('refused')
    expect((await camera('user')).is).toBe('open')
  })
})
