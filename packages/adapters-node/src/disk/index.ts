// The room on the relay's disk (REL-3; A, 25 Nov 2026: "soltanto un controllo
// [...] di occupazione disco, senza stare a guardare chi l'ha fatto"): the
// free space of the volume the database is on, as the system tells it
// (`fs.statfs`, given, so that a test gives a disk of its own), against the
// free space the relay keeps. Read again at most every few seconds, a read in
// flight shared: a deposit waits on no disk but the first. It knows nothing
// of who deposits, nor of how much a mailbox holds: the disk as a whole.

/** What the system tells of a volume, the parts read: its blocks' size, how many, how many free to a process. */
export interface TheVolume {
  readonly bsize: number
  readonly blocks: number
  readonly bavail: number
}

/** How the system is asked about the volume a path is on (`fs.promises.statfs`). */
export type ReadTheVolume = (path: string) => Promise<TheVolume>

/** The room on the disk for a deposit: enough, or too little, below the free space the relay keeps. */
export type RoomOnTheDisk = { readonly room: 'enough' } | { readonly room: 'too_little' }

/** The disk's check before a deposit (REL-3): the room it has now. */
export type RoomForADeposit = () => Promise<RoomOnTheDisk>

/** The free space the relay keeps: the greater of so many bytes and a share of the volume. */
export interface FreeSpaceKept {
  readonly bytes: number
  readonly percent: number
}

/** A disk with room, always: a relay of the tests, in memory. */
export const always_room: RoomForADeposit = () => Promise.resolve({ room: 'enough' })

/** The free space a volume must keep, in bytes: the greater of the two (REL-3). */
export const the_free_space_kept = (volume: TheVolume, kept: FreeSpaceKept): number =>
  Math.max(kept.bytes, (volume.blocks * volume.bsize * kept.percent) / 100)

/** The room a volume has, by the free space kept. */
export const the_room_of = (volume: TheVolume, kept: FreeSpaceKept): RoomOnTheDisk =>
  volume.bavail * volume.bsize < the_free_space_kept(volume, kept)
    ? { room: 'too_little' }
    : { room: 'enough' }

/**
 * The room on the disk a path is on (REL-3): read through the system's port,
 * then kept for `read_again_after` milliseconds by the monotonic time
 * `now` gives; a read that fails is the process's fault, not a full disk,
 * and is not kept (the next deposit asks again).
 */
export const the_room_on_the_disk = (disk: {
  readonly path: string
  readonly kept: FreeSpaceKept
  readonly read: ReadTheVolume
  readonly now: () => number
  readonly read_again_after: number
}): RoomForADeposit => {
  let last: { readonly at: number; readonly room: Promise<RoomOnTheDisk> } | undefined
  return () => {
    const now = disk.now()
    if (last !== undefined && now - last.at < disk.read_again_after) return last.room
    const room = disk.read(disk.path).then((volume) => the_room_of(volume, disk.kept))
    const read = { at: now, room }
    last = read
    room.catch(() => {
      if (last === read) last = undefined
    })
    return room
  }
}
