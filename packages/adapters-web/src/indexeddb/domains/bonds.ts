// Being written (part 21.2).
import { the_records_of_a_domain } from '../records.ts'

/** The address book's records (WEB-8): `['state', 'face', face_id]` a face, `['state', 'bond', bond_id]` a bond; read by `extensions` too (GR-3). */
export const the_address_book_s_records = the_records_of_a_domain('bonds/address_book')

export const bonds_ports_on_indexeddb = (): never => {
  throw new Error('part 21.2: being written')
}
