import type * as zz from '@q-mino/domains/library'
import type { Hosted } from './hosting.ts'

// The extensions follow the office (EXT-7, EXT-15, USR-9; step 17): the
// kernel loads an extension when its user activates it, and unloads it at
// her deactivation; the office only records the fact (the port toward
// `self` carries out the activity, the leaf records it). A durable consumer
// the configurator sets to start (CFG-2): it follows the node's fact log
// and, once caught up (the node's start) and after each fact of the office
// (`extensions/activations`), brings each extension hosted to what the
// office says of it, and the requests in flight too: those of an extension
// not active, or not offered to their bond, called off (F7, EXT-7, PST-14;
// A, 21 Nov 2026).

/** The path of the office's facts, which this consumer looks at again after. */
const the_office = 'extensions/activations/'

/** The office's fact of an extension offered to a bond, after a withdrawal (EXT-7). */
const an_offer_given = 'extensions/activations/fact/an_extension_has_been_offered_to_a_bond'

/** An extension hosted, as the consumer moves it: its name, and its hosting's load, unload and life (EXT-15). */
export interface AnExtensionHosted {
  readonly name: string
  readonly hosted: Pick<Hosted, 'load' | 'unload' | 'life'>
}

/**
 * The consumer's wiring: the node's fact log (DOM-17); whether an
 * extension is active, by the office's read (EXT-7, `the_kernels_reads`);
 * the extensions hosted now (an update of the app changes them); the
 * calling off of the port of requests, one look (`the_calling_off`, F7);
 * who is told, after the look, that an extension was offered to a bond
 * again (MSG-16: the node's collector forgets what it saw).
 */
export interface TheFollowingWiring {
  readonly log: zz.FactLog
  readonly is_active: (extension: string) => Promise<boolean>
  readonly hosted: () => readonly AnExtensionHosted[]
  readonly the_calling_off: () => Promise<readonly string[]>
  readonly when_an_offer_is_given: () => void
}

/** The consumer running: stopped when asked, its fault, if it fell, thrown then. */
export interface TheFollowing {
  readonly stop: () => Promise<void>
}

/**
 * The extensions following the office (EXT-15), wired, not started: started,
 * it reads the fact log from the first fact the node keeps (one iteration,
 * never started again from the same position: the log resumes inclusively,
 * DOM-17), the facts up to `caught_up` passed over, then looks at each
 * extension hosted: active and unloaded, or active again after a
 * deactivation (a stop by two falls or a `ready` that differed is tried
 * again only by a new activation), loaded; not active and loading or
 * running, unloaded; then the calling off, which calls off the requests in
 * flight of an extension not active or not offered to their bond, so that
 * `post` sends them again no more and their deliveries read the refusal
 * (F7, PST-14), a fall between a gesture and its look made good at the
 * next start. Again after each fact with a part of the office's; after
 * an offer to a bond, who is told is told (MSG-16). It
 * waits on the log's next event or its stop, never in a loop of its own.
 * A load or an unload that throws stops it, the fault thrown at `stop`.
 */
export const the_extensions_follow_the_office =
  (wiring: TheFollowingWiring) => (): TheFollowing => {
    let stopping = false
    let stop_now = (): void => undefined
    const stopped = new Promise<'stopped'>((resolve) => {
      stop_now = () => {
        resolve('stopped')
      }
    })
    /** Whether each extension was active at the last look, by name. */
    const was_active = new Map<string, boolean>()

    /** One look (EXT-15): each extension hosted brought to what the office says of it. */
    const looks = async (): Promise<void> => {
      for (const each of wiring.hosted()) {
        const active = await wiring.is_active(each.name)
        const life = each.hosted.life().life
        const activated_again = was_active.get(each.name) === false
        was_active.set(each.name, active)
        if (active && (life === 'unloaded' || (life === 'stopped' && activated_again))) {
          await each.hosted.load()
        } else if (!active && (life === 'loading' || life === 'running')) {
          await each.hosted.unload()
        }
      }
      await wiring.the_calling_off()
    }

    const fell: unknown[] = []
    /** A look, until it is over or the consumer stops: a load still waiting for its `ready` goes on alone. */
    const a_look = async (): Promise<void> => {
      const look = looks().catch((fault: unknown) => {
        fell.push(fault)
      })
      await Promise.race([look, stopped])
    }

    const run = async (): Promise<void> => {
      const log = wiring.log(undefined)[Symbol.asyncIterator]()
      let caught_up = false
      let next = log.next()
      while (!stopping && fell.length === 0) {
        const woke = await Promise.race([stopped, next.then((arrived) => ({ arrived }))])
        if (woke === 'stopped' || woke.arrived.done === true) return
        next = log.next()
        const event = woke.arrived.value
        if (event.event === 'position_unavailable') {
          throw new Error('the log keeps the first position no longer (DOM-17)')
        }
        if (event.event === 'caught_up') {
          if (!caught_up) await a_look()
          caught_up = true
          continue
        }
        if (caught_up && event.fact.parts.some((part) => part.path.startsWith(the_office))) {
          await a_look()
          if (event.fact.parts.some((part) => part.path === an_offer_given)) {
            wiring.when_an_offer_is_given()
          }
        }
      }
    }

    const running = run().catch((fault: unknown) => {
      fell.push(fault)
    })
    return {
      stop: async () => {
        stopping = true
        stop_now()
        await running
        if (fell.length > 0) throw fell[0]
      },
    }
  }
