import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import {
  a_look_every,
  the_bytes_a_qr_holds,
  the_link_of_a_ticket,
  the_qr_of,
  the_text_in,
  the_texts_seen,
  the_ticket_in_a_link,
  type ALook,
  type Modules,
} from '../../src/index.ts'
import { a_blank_frame, a_frame_of, a_ticket, lucas_ticket, the_page } from '../fixtures.ts'

// QRs drawn and read (WEB-2): a text drawn as a QR, read back from a
// camera's frame; the SVG of the same modules; the texts seen through a
// camera, one look every so often, each once.

const modules_of = (text: string): Modules => {
  const qr = the_qr_of(text)
  if (qr.drawn !== 'a_qr') throw new Error(`no QR for a text of ${String(text.length)} characters`)
  return qr.modules
}

const link_of = the_link_of_a_ticket(the_page)

/** The modules an SVG of a QR draws dark, read back from its path. */
const modules_in_the_svg = (svg: string): Modules => {
  const size = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)?.[1])
  const dark = Array.from({ length: size }, () => Array.from({ length: size }, () => false))
  for (const [, from, line, length] of svg.matchAll(/M(\d+) (\d+)h(\d+)v1h-\3z/g)) {
    for (let column = Number(from); column < Number(from) + Number(length); column++) {
      const row = dark[Number(line)]
      if (row !== undefined) row[column] = true
    }
  }
  return dark
}

describe("a ticket's QR", () => {
  test('gives back the link it draws, the ticket in it', () => {
    fc.assert(
      fc.property(a_ticket, (ticket) => {
        const link = link_of(ticket)
        const modules = modules_of(link)
        const frame = a_frame_of(modules, {
          pixels: 3,
          left: 0,
          top: 0,
          width: modules.length * 3,
          height: modules.length * 3,
        })
        const read = the_text_in(frame)
        expect(read).toBe(link)
        expect(the_ticket_in_a_link(read ?? '')).toEqual({ carries: 'a_ticket', ticket })
      }),
      { numRuns: 20 },
    )
  })

  test('is read where a camera sees it: in a part of a larger frame', () => {
    const link = link_of(lucas_ticket)
    const modules = modules_of(link)
    const frame = a_frame_of(modules, { pixels: 4, left: 150, top: 60, width: 640, height: 480 })
    expect(the_text_in(frame)).toBe(link)
  })

  test('has a quiet zone of four light modules around it', () => {
    const modules = modules_of(link_of(lucas_ticket))
    const quiet = [...modules.slice(0, 4), ...modules.slice(-4)].flat()
    const sides = modules.flatMap((row) => [...row.slice(0, 4), ...row.slice(-4)])
    expect([...quiet, ...sides].every((dark) => !dark)).toBe(true)
    expect(modules[4]?.[4]).toBe(true)
  })

  test('of a ticket on a relay of a usual address fits a phone screen: version 16 at most, 81 modules and its quiet zone', () => {
    const modules = modules_of(link_of(lucas_ticket))
    expect(modules.length).toBeLessThanOrEqual(81 + 8)
  })

  test('in SVG draws the same modules, dark on light', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 200 }), (text) => {
        const qr = the_qr_of(text)
        if (qr.drawn !== 'a_qr') throw new Error('a short text always has its QR')
        expect(modules_in_the_svg(qr.svg)).toEqual(qr.modules)
        expect(qr.svg).toContain('fill="#fff"')
        expect(qr.svg).toContain('fill="#000"')
      }),
      { numRuns: 30 },
    )
  })

  test('is nothing for a text longer than a QR holds, in UTF-8 bytes', () => {
    expect(the_qr_of('a'.repeat(the_bytes_a_qr_holds)).drawn).toBe('a_qr')
    expect(the_qr_of('a'.repeat(the_bytes_a_qr_holds + 1))).toEqual({
      drawn: 'nothing',
      because: 'the_text_is_too_long',
    })
    expect(the_qr_of('é'.repeat(Math.ceil((the_bytes_a_qr_holds + 1) / 2))).drawn).toBe('nothing')
    const far_relay = `https://relay.example/${'r'.repeat(2000)}`
    const ticket = { ...lucas_ticket, mailbox: { ...lucas_ticket.mailbox, relays: [far_relay] } }
    expect(the_qr_of(link_of(ticket)).drawn).toBe('nothing')
  })

  test('reads nothing in a frame with no QR', () => {
    expect(the_text_in(a_blank_frame)).toBeUndefined()
  })
})

describe('the texts seen through a camera', () => {
  const frame_of = (text: string) => {
    const modules = modules_of(text)
    return a_frame_of(modules, {
      pixels: 3,
      left: 10,
      top: 10,
      width: modules.length * 3 + 20,
      height: modules.length * 3 + 20,
    })
  }
  const seeing = (frame: ReturnType<typeof frame_of>): ALook => ({ sees: 'a_frame', frame })

  /** A camera that sees these, one a look, then nothing more; the time that passes, recorded, at once. */
  const a_camera_seeing = (looks: readonly ALook[]) => {
    const waited: number[] = []
    let next = 0
    return {
      look: (): ALook => looks[next++] ?? { sees: 'nothing_more' },
      elapsed: (milliseconds: number) => {
        waited.push(milliseconds)
        return Promise.resolve()
      },
      waited,
      looked: () => next,
    }
  }

  test('are each QR held in front of it, once, until it sees nothing more', async () => {
    const link = link_of(lucas_ticket)
    const camera = a_camera_seeing([
      { sees: 'nothing_yet' },
      seeing(frame_of(link)),
      seeing(frame_of(link)),
      { sees: 'a_frame', frame: a_blank_frame },
      seeing(frame_of('WIFI:S:home;T:WPA;P:secret;;')),
      seeing(frame_of(link)),
    ])
    const seen: string[] = []
    for await (const text of the_texts_seen(camera.look, camera.elapsed)) seen.push(text)
    expect(seen).toEqual([link, 'WIFI:S:home;T:WPA;P:secret;;', link])
    expect(camera.waited).toEqual(Array.from({ length: 6 }, () => a_look_every))
  })

  test('stop being looked for when their consumer stops', async () => {
    const link = link_of(lucas_ticket)
    const camera = a_camera_seeing([
      seeing(frame_of(link)),
      seeing(frame_of('another')),
      seeing(frame_of('a third')),
    ])
    for await (const text of the_texts_seen(camera.look, camera.elapsed)) {
      expect(the_ticket_in_a_link(text).carries).toBe('a_ticket')
      break
    }
    expect(camera.looked()).toBe(1)
  })
})
