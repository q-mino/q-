import { createSignal, For, Match, onMount, Show, Switch, type JSX } from 'solid-js'
import type {
  ANodeRunning,
  HowItAsks,
  TheStart,
  WhyItDoesNotStart,
  WhyItStopped,
} from './node/index.ts'
import { texts } from './texts/index.ts'
import { UpdatePrompt } from './UpdatePrompt.tsx'

// The app's frame (PWA-2, PWA-5): the node's start in this tab and what it
// came to, each a screen of its own, the kernel's screens once it runs
// (WEB-18); the storage the browser keeps or may clear, told (WEB-11, F6);
// the update with notice; where the files come from. A node that stops by
// itself (another tab took it, a new release closed it) says so and offers
// to open it here again (WEB-10).

const repository = 'https://github.com/q-mino/q-'

// The commit's instant, told in the device's zone and the Italian way (A, 23 Nov 2026).
const the_time_of = (instant: string): string =>
  new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(
    Date.parse(instant),
  )

/** What the app shows now: the start under way, or what it came to. */
type TheAppNow =
  | { readonly now: 'opening' }
  | { readonly now: 'another_tab' }
  | { readonly now: 'it_does_not_start'; readonly why: WhyItDoesNotStart }
  | { readonly now: 'running'; readonly node: ANodeRunning }
  | { readonly now: 'stopped'; readonly why: WhyItStopped }

/** The app's wiring: the node's start, the screens of a node running, the page opened again. */
export interface TheAppsWiring {
  readonly starts: (how: HowItAsks) => Promise<TheStart>
  readonly screens: (node: ANodeRunning) => JSX.Element
  readonly reopens: () => void
}

const why_of = (fault: unknown): string => (fault instanceof Error ? fault.message : String(fault))

export const App = (props: TheAppsWiring) => {
  const [now, set_now] = createSignal<TheAppNow>({ now: 'opening' })
  const opens = (how: HowItAsks): void => {
    set_now({ now: 'opening' })
    props.starts(how).then(
      (start) => {
        switch (start.start) {
          case 'another_tab':
            set_now({ now: 'another_tab' })
            return
          case 'it_does_not_start':
            set_now({ now: 'it_does_not_start', why: start.why })
            return
          case 'running':
            set_now({ now: 'running', node: start.node })
            void start.node.stopped.then((why) => {
              set_now({ now: 'stopped', why })
            })
            return
        }
      },
      (fault: unknown) => {
        set_now({ now: 'it_does_not_start', why: { why: 'a_fault', message: why_of(fault) } })
      },
    )
  }
  onMount(() => {
    opens('if_no_tab_is')
  })
  const running = (): ANodeRunning | undefined => {
    const it = now()
    return it.now === 'running' ? it.node : undefined
  }
  const does_not_start = (): WhyItDoesNotStart | undefined => {
    const it = now()
    return it.now === 'it_does_not_start' ? it.why : undefined
  }
  const stopped = (): WhyItStopped | undefined => {
    const it = now()
    return it.now === 'stopped' ? it.why : undefined
  }
  const before_the_update = async (): Promise<void> => {
    await running()?.stops()
  }

  return (
    <main>
      <Switch>
        <Match when={now().now === 'opening'}>
          <p>{texts.start.opening}</p>
        </Match>
        <Match when={now().now === 'another_tab'}>
          <p>{texts.start.another_tab}</p>
          <button
            type="button"
            onClick={() => {
              opens('use_here')
            }}
          >
            {texts.start.use_here}
          </button>
        </Match>
        <Match when={does_not_start()}>
          {(why) => (
            <section role="alert">
              <Switch>
                <Match
                  when={(() => {
                    const it = why()
                    return it.why === 'an_extension_does_not_compose' ? it : undefined
                  })()}
                >
                  {(composing) => (
                    <>
                      <h1>{texts.start.an_extension_does_not_compose}</h1>
                      <ul>
                        <For each={composing().faults}>
                          {(one) => (
                            <li>{texts.start.the_composition_faults[one.fault](one.extension)}</li>
                          )}
                        </For>
                      </ul>
                    </>
                  )}
                </Match>
                <Match when={why().why === 'a_fault'}>
                  <h1>{texts.start.it_does_not_start}</h1>
                </Match>
              </Switch>
              <h2>{texts.start.why}</h2>
              <pre>{why().message}</pre>
            </section>
          )}
        </Match>
        <Match when={stopped()}>
          {(why) => (
            <Switch>
              <Match when={why() === 'used_elsewhere'}>
                <p>{texts.start.used_elsewhere}</p>
                <button
                  type="button"
                  onClick={() => {
                    opens('use_here')
                  }}
                >
                  {texts.start.use_here}
                </button>
              </Match>
              <Match when={why() === 'closed_for_a_new_release'}>
                <p>{texts.start.closed_for_a_new_release}</p>
                <button
                  type="button"
                  onClick={() => {
                    props.reopens()
                  }}
                >
                  {texts.start.reload}
                </button>
              </Match>
            </Switch>
          )}
        </Match>
        <Match when={running()}>
          {(node) => (
            <>
              <Show when={node().the_storage === 'best_effort'}>
                <p role="note">{texts.the_storage.best_effort}</p>
              </Show>
              <Show when={node().the_storage === 'not_told'}>
                <p role="note">{texts.the_storage.not_told}</p>
              </Show>
              {props.screens(node())}
            </>
          )}
        </Match>
      </Switch>
      <footer>
        <Show when={__Q_CHANNEL__ !== 'release'}>
          <p>
            <strong>{texts.app.testChannel}</strong>
          </p>
        </Show>
        <h2>{texts.about.title}</h2>
        <p>
          {texts.app.name} ({texts.app.reading}) · {texts.about.version}: {__Q_VERSION__} ·{' '}
          {texts.about.code}:{' '}
          <a href={`${repository}/commit/${__Q_COMMIT__}`}>{__Q_COMMIT__.slice(0, 7)}</a>
          <Show when={__Q_COMMITTED_AT__ !== 'unknown'}>
            {' '}
            {texts.about.committed_on(the_time_of(__Q_COMMITTED_AT__))}
          </Show>
        </p>
      </footer>
      <UpdatePrompt before_the_update={before_the_update} />
    </main>
  )
}
