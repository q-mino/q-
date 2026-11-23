import type * as boundary from '@q-mino/boundary'

// The extensions' partitions on the oracle (EXT-14; part 12.4): the node's
// storage for its extensions, a map per extension under its name, which no
// other extension reaches and the kernel never reads, only carries. Keys in
// the order of their code units (as IndexedDB orders strings); a read of
// some keys or of a range; a commit all or none, in order; a partition
// full (a size limit given at wiring, in characters of its keys and of its
// values' JSON) refuses the commit, a technical outcome (DOM-15).

/** A partition's entries, by key. */
type Entries = ReadonlyMap<string, boundary.Json>

/** The size of a partition: the characters of its keys and of its values' JSON. */
const the_size_of = (entries: Entries): number =>
  [...entries].reduce((size, [key, value]) => size + key.length + JSON.stringify(value).length, 0)

/** Keys in the order of their code units. */
const in_order = (keys: Iterable<string>): readonly string[] =>
  [...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

/**
 * The partitions of a node's extensions on the oracle (EXT-14), each at most
 * `characters` large: `of(name)`, the storage the kernel gives that
 * extension (`boundary.Ports['its_storage']`); `kept(name)`, what its
 * partition holds, for a story to read (the kernel never does).
 */
export const partitions = (limit: { readonly characters: number }) => {
  const kept = new Map<string, Entries>()
  const entries_of = (name: string): Entries => kept.get(name) ?? new Map()
  const of = (name: string): boundary.Ports['its_storage'] => ({
    read: (read) => {
      const entries = entries_of(name)
      const keys =
        read.read === 'keys'
          ? read.keys
          : in_order(entries.keys()).filter(
              (key) =>
                (read.from === undefined || key >= read.from) &&
                (read.before === undefined || key < read.before),
            )
      return Promise.resolve({
        answer: 'read',
        entries: keys.flatMap((key) => {
          const value = entries.get(key)
          return value === undefined ? [] : [{ key, value }]
        }),
      })
    },
    commit: (writes) => {
      const next = new Map(entries_of(name))
      for (const write of writes) {
        if (write.write === 'set') next.set(write.key, write.value)
        else next.delete(write.key)
      }
      if (the_size_of(next) > limit.characters) {
        return Promise.resolve({ answer: 'refused', why: 'the_partition_is_full' })
      }
      kept.set(name, next)
      return Promise.resolve({ answer: 'committed' })
    },
  })
  return { of, kept: entries_of }
}

/** The extensions' partitions of a node on the oracle. */
export type Partitions = ReturnType<typeof partitions>
