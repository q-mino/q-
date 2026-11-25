import { describe, expect, test } from 'vitest'
import {
  the_free_space_kept,
  the_room_of,
  the_room_on_the_disk,
  type TheVolume,
} from '../src/index.ts'

// The room on the relay's disk (REL-3): the free space kept, the greater of
// so many bytes and a share of the volume; a reading kept a few seconds and
// shared while in flight; a reading that fails, not kept.

const a_volume = (bavail: number): TheVolume => ({ bsize: 4096, blocks: 1_000_000, bavail })
const kept = { bytes: 1024 ** 3, percent: 10 }

describe('the free space kept (REL-3)', () => {
  test('the greater of the bytes and the share of the volume', () => {
    expect(the_free_space_kept(a_volume(0), kept)).toBe(1024 ** 3)
    expect(the_free_space_kept({ bsize: 4096, blocks: 5_000_000, bavail: 0 }, kept)).toBe(
      2_048_000_000,
    )
  })

  test('below it the room is too little; at it, enough', () => {
    const at = Math.ceil(1024 ** 3 / 4096)
    expect(the_room_of(a_volume(at - 1), kept)).toEqual({ room: 'too_little' })
    expect(the_room_of(a_volume(at), kept)).toEqual({ room: 'enough' })
  })
})

describe('the room on the disk, read through the system (REL-3)', () => {
  const a_disk = () => {
    const asked: string[] = []
    let now = 0
    let free = 500_000
    let fails = false
    const room = the_room_on_the_disk({
      path: '/var/lib/relay',
      kept,
      read: (path) => {
        asked.push(path)
        return fails ? Promise.reject(new Error('EIO')) : Promise.resolve(a_volume(free))
      },
      now: () => now,
      read_again_after: 5_000,
    })
    return {
      room,
      asked,
      at: (to: number) => {
        now = to
      },
      free: (blocks: number) => {
        free = blocks
      },
      failing: (yes: boolean) => {
        fails = yes
      },
    }
  }

  test('read once every few seconds, a reading in flight shared', async () => {
    const disk = a_disk()
    const [first, second] = await Promise.all([disk.room(), disk.room()])
    expect(first).toEqual({ room: 'enough' })
    expect(second).toEqual({ room: 'enough' })
    disk.free(10)
    disk.at(4_999)
    expect(await disk.room()).toEqual({ room: 'enough' })
    disk.at(5_000)
    expect(await disk.room()).toEqual({ room: 'too_little' })
    expect(disk.asked).toEqual(['/var/lib/relay', '/var/lib/relay'])
  })

  test('a reading that fails is a fault, not a full disk, and the next asks again', async () => {
    const disk = a_disk()
    disk.failing(true)
    await expect(disk.room()).rejects.toThrow('EIO')
    disk.failing(false)
    expect(await disk.room()).toEqual({ room: 'enough' })
    expect(disk.asked).toHaveLength(2)
  })
})
