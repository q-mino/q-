import { signal } from '@preact/signals'
import type { JSX } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import {
  why_it_does_not_start,
  type ANodeRunning,
  type HowItAsks,
  type TheStart,
  type WhyItDoesNotStart,
  type WhyItStopped,
} from './node/index.ts'
import { Flaw, Gesture, Notice, Why } from '@q-mino/adapters-web/design'
import { the_build } from './build_info.ts'
import { texts } from './texts/index.ts'
import { UpdatePrompt } from './UpdatePrompt.tsx'

// The app's frame (PWA-2, PWA-5): the node's start in this tab and what it
// came to, each a screen of its own, the kernel's screens once it runs
// (WEB-18); the storage the browser keeps or may clear, told (WEB-11, F6);
// the update with notice; where the files come from. A node that stops by
// itself (another tab took it, a new release closed it) says so and offers
// to open it here again (WEB-10). The data of an older test release (WEB-8),
// met at the start or by the screens' first reads, can be cleared on the
// test channel only: the node stopped, its database deleted, the app opened
// again.

const repository = 'https://github.com/q-mino/q-'

// The commit's instant, told in the device's zone and the Italian way (A, 23 Nov 2026).
const the_time_of = (instant: string): string =>
  new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(
    Date.parse(instant),
  )

/** What the app shows now: the start under way, or what it came to; the data being cleared (WEB-8). */
type TheAppNow =
  | { readonly now: 'opening' }
  | { readonly now: 'clearing_the_data' }
  | { readonly now: 'another_tab' }
  | { readonly now: 'it_does_not_start'; readonly why: WhyItDoesNotStart }
  | { readonly now: 'running'; readonly node: ANodeRunning }
  | { readonly now: 'stopped'; readonly why: WhyItStopped }

/**
 * The app's wiring: the node's start; the screens of a node running, given
 * her gesture on the data of an older test release on the test channel only
 * (WEB-8, WEB-18); the page opened again; the node's database deleted.
 */
export interface TheAppsWiring {
  readonly starts: (how: HowItAsks) => Promise<TheStart>
  readonly screens: (
    node: ANodeRunning,
    clears_the_data_and_starts_again: (() => void) | undefined,
  ) => JSX.Element
  readonly reopens: () => void
  readonly clears_the_data: () => Promise<void>
}

export const App = (props: TheAppsWiring) => {
  // The app's state, made at its first render, the same at every render after.
  const made = useRef<ReturnType<typeof the_app_s_state> | undefined>(undefined)
  made.current ??= the_app_s_state(props)
  const { now, opens, clears_the_data_and_starts_again, on_the_test_channel } = made.current
  useEffect(() => {
    opens('if_no_tab_is')
  }, [])
  const it = now.value
  const before_the_update = async (): Promise<void> => {
    const at_the_update = now.peek()
    if (at_the_update.now === 'running') await at_the_update.node.stops()
  }

  const taps = (does: () => void) => ({ does: 'taps', taps: does }) as const
  return (
    <div class="app" data-state={it.now}>
      {(it.now === 'opening' || it.now === 'clearing_the_data') && (
        <div data-part="told">
          <Notice kind="waiting">{texts.start.opening}</Notice>
        </div>
      )}
      {it.now === 'another_tab' && (
        <div data-part="told">
          <Notice kind="information">{texts.start.another_tab}</Notice>
          <Gesture
            kind="primary"
            label={texts.start.use_here}
            does={taps(() => {
              opens('use_here')
            })}
          />
        </div>
      )}
      {it.now === 'it_does_not_start' && (
        <section role="alert" class="it-does-not-start" data-state={it.why.why}>
          {it.why.why === 'an_extension_does_not_compose' && (
            <>
              <h1>{texts.start.an_extension_does_not_compose}</h1>
              <ul>
                {it.why.faults.map((one, index) => (
                  <li key={index}>
                    {texts.start.the_composition_faults[one.fault](one.extension)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {it.why.why === 'the_data_of_an_older_test_release' && (
            <>
              <h1>{texts.start.it_does_not_start}</h1>
              <p>{texts.start.the_data_of_an_older_test_release}</p>
              {on_the_test_channel && (
                <Gesture
                  kind="dangerous"
                  label={texts.start.clear_the_data_and_start_again}
                  does={taps(() => {
                    clears_the_data_and_starts_again(undefined)
                  })}
                />
              )}
            </>
          )}
          {it.why.why === 'a_fault' && <h1>{texts.start.it_does_not_start}</h1>}
          <Why title={texts.start.why} message={it.why.message} />
        </section>
      )}
      {it.now === 'stopped' && it.why === 'used_elsewhere' && (
        <div data-part="told">
          <Notice kind="information">{texts.start.used_elsewhere}</Notice>
          <Gesture
            kind="primary"
            label={texts.start.use_here}
            does={taps(() => {
              opens('use_here')
            })}
          />
        </div>
      )}
      {it.now === 'stopped' && it.why === 'closed_for_a_new_release' && (
        <div data-part="told">
          <Notice kind="information">{texts.start.closed_for_a_new_release}</Notice>
          <Gesture
            kind="primary"
            label={texts.start.reload}
            glyph="refresh_cw"
            does={taps(() => {
              props.reopens()
            })}
          />
        </div>
      )}
      {it.now === 'running' && (
        <TheNodeRunning
          node={it.node}
          screens={props.screens}
          clears_the_data_and_starts_again={
            on_the_test_channel ? clears_the_data_and_starts_again : undefined
          }
        />
      )}
      <footer class="about">
        {the_build.channel !== 'release' && (
          <p data-part="channel">
            <strong>{texts.app.testChannel}</strong>
          </p>
        )}
        <h2>{texts.about.title}</h2>
        <p>
          {texts.app.name} ({texts.app.reading}) · {texts.about.version}: {the_build.version} ·{' '}
          {texts.about.code}:{' '}
          <a href={`${repository}/commit/${the_build.commit}`}>{the_build.commit.slice(0, 7)}</a>
          {the_build.committed_at !== 'unknown' && (
            <> {texts.about.committed_on(the_time_of(the_build.committed_at))}</>
          )}
        </p>
      </footer>
      <UpdatePrompt before_the_update={before_the_update} />
    </div>
  )
}

/** The app's state and its gestures: the node's start, what it came to, the data cleared. */
const the_app_s_state = (props: TheAppsWiring) => {
  const now = signal<TheAppNow>({ now: 'opening' })
  /** The gesture, on the test channel only (WEB-8): on the release the sentence alone. */
  const on_the_test_channel = the_build.channel !== 'release'
  const opens = (how: HowItAsks): void => {
    now.value = { now: 'opening' }
    props.starts(how).then(
      (start) => {
        switch (start.start) {
          case 'another_tab':
            now.value = { now: 'another_tab' }
            return
          case 'it_does_not_start':
            now.value = { now: 'it_does_not_start', why: start.why }
            return
          case 'running':
            now.value = { now: 'running', node: start.node }
            void start.node.stopped.then((why) => {
              // Stopped to clear the data, the node is not told as stopped by itself.
              if (now.peek().now !== 'clearing_the_data') now.value = { now: 'stopped', why }
            })
            return
        }
      },
      (fault: unknown) => {
        now.value = { now: 'it_does_not_start', why: why_it_does_not_start(fault) }
      },
    )
  }
  /** Her gesture on the data of an older test release (WEB-8): the node stopped, if it runs, its database deleted, the app opened again. */
  const clears_the_data_and_starts_again = (node: ANodeRunning | undefined): void => {
    now.value = { now: 'clearing_the_data' }
    void (async () => {
      await node?.stops()
      await props.clears_the_data()
      props.reopens()
    })().catch((fault: unknown) => {
      now.value = { now: 'it_does_not_start', why: why_it_does_not_start(fault) }
    })
  }
  return { now, opens, clears_the_data_and_starts_again, on_the_test_channel }
}

/** The gesture on the data for this node, when the channel gives it. */
const the_gesture_on = (
  node: ANodeRunning,
  clears: ((node: ANodeRunning | undefined) => void) | undefined,
): (() => void) | undefined =>
  clears === undefined
    ? undefined
    : () => {
        clears(node)
      }

/** A node running: the storage told (WEB-11), and its screens, made once for it. */
const TheNodeRunning = (props: {
  node: ANodeRunning
  screens: TheAppsWiring['screens']
  /** Her gesture on the data of an older test release, on the test channel only (WEB-8). */
  clears_the_data_and_starts_again: ((node: ANodeRunning | undefined) => void) | undefined
}) => {
  const screens = useRef<{ readonly node: ANodeRunning; readonly drawn: JSX.Element } | undefined>(
    undefined,
  )
  if (screens.current?.node !== props.node)
    screens.current = {
      node: props.node,
      drawn: props.screens(
        props.node,
        the_gesture_on(props.node, props.clears_the_data_and_starts_again),
      ),
    }
  return (
    <>
      {props.node.the_storage !== 'persistent' && (
        <div data-part="the-storage" data-state={props.node.the_storage}>
          <Flaw title={texts.the_storage.title}>
            {props.node.the_storage === 'best_effort'
              ? texts.the_storage.best_effort
              : texts.the_storage.not_told}
          </Flaw>
        </div>
      )}
      {screens.current.drawn}
    </>
  )
}
