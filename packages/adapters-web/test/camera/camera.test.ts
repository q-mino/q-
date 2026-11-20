import { describe, expect, test } from 'vitest'
import { open_the_rear_camera, the_rear_camera_s_constraints, why_not_on } from '../../src/index.ts'

// The camera (WEB-2): what the browser is asked for, and its refusals as
// outcomes. The stream played and looked through is the browser's, proved
// on the phones (step 27): Node has no camera.

describe('the rear camera', () => {
  test('is asked for as video only, facing away from the user where there is such a camera', async () => {
    const asked: MediaStreamConstraints[] = []
    await open_the_rear_camera({
      getUserMedia: (constraints) => {
        if (constraints !== undefined) asked.push(constraints)
        return Promise.reject(new DOMException('no camera here', 'NotFoundError'))
      },
    })
    expect(asked).toEqual([the_rear_camera_s_constraints])
    expect(the_rear_camera_s_constraints).toEqual({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
  })

  test('is not on when the browser refuses it, and says why', async () => {
    const refusing = (name: string) => ({
      getUserMedia: () => Promise.reject(new DOMException(`refused: ${name}`, name)),
    })
    const outcomes = await Promise.all(
      [
        'NotAllowedError',
        'SecurityError',
        'NotFoundError',
        'OverconstrainedError',
        'NotReadableError',
        'AbortError',
      ].map(async (name) => (await open_the_rear_camera(refusing(name))).is),
    )
    expect(outcomes).toEqual(['refused', 'refused', 'missing', 'missing', 'busy', 'busy'])
  })

  test('is busy for a refusal the browser does not name', () => {
    expect(why_not_on(new Error('the camera fell'))).toBe('busy')
    expect(why_not_on('a thrown string')).toBe('busy')
  })
})
