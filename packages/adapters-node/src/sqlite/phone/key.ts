// A key of the node's database as SQLite orders it (part B2 of the
// assistant, AST-2) [Q, C, 27 Nov 2026]: an encoding in bytes whose order,
// SQLite's for a BLOB (byte by byte, a shorter one first when it is a
// prefix), is IndexedDB's order of the keys (WEB-8): numbers before texts
// before arrays; numbers by value; texts by UTF-16 code units; arrays part
// by part, a shorter one first. Each part is a tag and its bytes: a number
// its eight bytes, a text its code units with a terminator, an array its
// parts with a terminator, so that no part's bytes are the prefix of
// another's. Rejected: the key's JSON as a text column (SQLite's order of
// texts is not IndexedDB's of keys: `[10]` before `[9]`); a column per part
// (the keys have no fixed shape).

import type { AStoredKey } from '@q-mino/adapters-common'

/** The tags of a part, in the order of IndexedDB's types; the terminator below them all. */
const the_end = 0x00
const a_number = 0x10
const a_text = 0x20
const an_array = 0x30

/** A number's eight bytes, ordered as the numbers: the sign flipped if positive, every bit if negative. */
const the_bytes_of_a_number = (value: number): readonly number[] => {
  if (Number.isNaN(value)) throw new Error('a key of the node’s database is never NaN')
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value === 0 ? 0 : value)
  const bytes = Array.from(new Uint8Array(view.buffer))
  const negative = ((bytes[0] ?? 0) & 0x80) !== 0
  return bytes.map((byte, at) => (negative ? ~byte & 0xff : at === 0 ? byte ^ 0x80 : byte))
}

/**
 * A text's code units, two bytes each, high first; a zero byte escaped as
 * `00 FF`, and the text ended by `00 01`, which sorts before any byte that
 * follows in a longer text.
 */
const the_bytes_of_a_text = (value: string): readonly number[] => {
  const bytes: number[] = []
  for (let at = 0; at < value.length; at += 1) {
    const unit = value.charCodeAt(at)
    for (const byte of [unit >> 8, unit & 0xff]) {
      if (byte === 0) bytes.push(0x00, 0xff)
      else bytes.push(byte)
    }
  }
  bytes.push(0x00, 0x01)
  return bytes
}

const the_bytes_of = (key: AStoredKey): readonly number[] =>
  typeof key === 'number'
    ? [a_number, ...the_bytes_of_a_number(key)]
    : typeof key === 'string'
      ? [a_text, ...the_bytes_of_a_text(key)]
      : [an_array, ...key.flatMap(the_bytes_of), the_end]

/** A key encoded, in SQLite's order of BLOBs as IndexedDB orders the keys. */
export const encoded = (key: AStoredKey): Uint8Array => new Uint8Array(the_bytes_of(key))
