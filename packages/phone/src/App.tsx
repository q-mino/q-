import { Show } from 'solid-js'
import { texts } from './texts/index.ts'
import { UpdatePrompt } from './UpdatePrompt.tsx'

const repository = 'https://github.com/q-mino/q-'

export const App = () => (
  <main>
    <h1>
      {texts.app.name} <small>({texts.app.reading})</small>
    </h1>
    <Show when={__Q_CHANNEL__ !== 'release'}>
      <p>
        <strong>{texts.app.testChannel}</strong>
      </p>
    </Show>
    <p>{texts.app.empty}</p>
    <section>
      <h2>{texts.about.title}</h2>
      <p>
        {texts.about.version}: {__Q_VERSION__}
      </p>
      <p>
        {texts.about.code}:{' '}
        <a href={`${repository}/commit/${__Q_COMMIT__}`}>{__Q_COMMIT__.slice(0, 7)}</a>
      </p>
    </section>
    <UpdatePrompt />
  </main>
)
