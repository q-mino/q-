import * as z from 'zod'

// Formats (DOM-24): branded values with no word of a domain. A format's brand
// is its name: no domain path is a bare name, so it meets no domain's brand.
// Beside them, the library's own values that every area reads: a version
// (`semver`, DOM-22), a cursor (DOM-20, SC-22) and a position (DOM-17).

/**
 * An instant, ISO 8601, written in the time zone of its writer, with its
 * offset (`2026-11-02T23:30:00-05:00`): the wall clock of the node that wrote
 * it, so that its day is a property of the record (`day_of`), the same for
 * every reader, every peer and every version (SC-12, C, 17 Nov 2026). Two
 * instants compare by their value, never as text: two offsets, and the hour
 * that repeats in autumn, tell one moment in two ways.
 */
export const date_time = z.iso.datetime({ offset: true }).brand<'date_time'>()

export type date_time = z.output<typeof date_time>

/** A calendar day, `YYYY-MM-DD`. */
export const day = z.iso.date().brand<'day'>()

export type day = z.output<typeof day>

/**
 * A time zone, by its IANA name (`America/Toronto`), with its rules: the
 * calendar of a node, by which its days start and end. An offset is not a
 * zone: in Toronto a loan taken on 20 October at `-04:00` is due on 3
 * November at `-05:00`. The library checks the name against the zones of its
 * runtime.
 */
export const time_zone = z.string().min(1).brand<'time_zone'>()

export type time_zone = z.output<typeof time_zone>

/**
 * The calendar day of an instant, the day of its writing: pure over the
 * instant alone, its date as its writer told it, so that a translation
 * between versions (`earlier`) can use it and never changes once published,
 * whatever the domain's `dsl` or the node's zone becomes (DOM-22). Marta took
 * the drill at 23:30 on 2 November in Toronto (`-05:00`): the 2nd, though it
 * was already the 3rd in UTC.
 */
export const day_of = (instant: date_time): day => day.parse(instant.slice(0, 10))

/** A version of a domain, semver: major, minor, patch. */
export const semver = z.templateLiteral([z.number(), '.', z.number(), '.', z.number()])

export type Semver = z.output<typeof semver>

/**
 * The cursor of a process with a cursor (DOM-20, D112.1): the order key of
 * the last instance handled, the values of the selection's order fields and
 * its identity (D109), encoded by the library (D114). Opaque to the business,
 * ordered and comparable: the library writes it in the step's own mutation,
 * the author only declares where the process keeps it. The default: a
 * business that must read it declares its own, the order key's fields, which
 * the library derives from the order, checks by type and writes the same way
 * (A, 16 Nov 2026), with its case. The same cursor closes a page of a
 * query (SC-22): the order key of its last entry, from which the next page
 * starts; carried by the persona and the client, never read by them (D57).
 */
export const cursor = z.string().min(1).brand<'cursor'>()

export type cursor = z.output<typeof cursor>

/** The position of a read: opaque, compared only by order (DOM-17). */
export const position = z.string().min(1).brand<'position'>()

export type position = z.output<typeof position>
