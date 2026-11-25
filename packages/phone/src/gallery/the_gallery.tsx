// The gallery (WEB-28): every component, and every screen, in every case,
// each story drawn twice side by side, in Roano and in Lavagna (each frame
// its own `color-scheme`, which `light-dark()` follows). Asked for one
// story and one theme (`?story=<id>&theme=light`), it shows that one alone,
// as the screenshots' script asks (`scripts/screens.mjs`). [Q, C, 24 Nov 2026]

import { QuestionsHoldThePage, SlotsTakeTheScreen } from '@q-mino/adapters-web/design'
import type { the_gallery } from '../texts/index.ts'
import type { AFileShown, AStoryShown } from './a_story.ts'

/** A theme of the gallery: Roano, the light one, Lavagna, the dark one. */
export type ATheme = 'light' | 'dark'

/** What the gallery is asked to show, from its address. */
export type WhatItShows =
  | { readonly shows: 'everything' }
  | { readonly shows: 'a_story'; readonly story: string; readonly themes: readonly ATheme[] }

const both: readonly ATheme[] = ['light', 'dark']

const AStory = (props: {
  story: AStoryShown
  themes: readonly ATheme[]
  texts: typeof the_gallery
}) => (
  <article class="gallery-story" data-story={props.story.id}>
    <h3>
      <a href={`?story=${props.story.id}`}>{props.story.name}</a>
    </h3>
    <div data-part="themes">
      {props.themes.map((theme) => (
        <div key={theme} data-part="theme" data-theme={theme}>
          <small data-part="theme-name">{props.texts.themes[theme]}</small>
          <QuestionsHoldThePage.Provider value={props.themes.length === 1}>
            <SlotsTakeTheScreen.Provider value={props.themes.length === 1}>
              {props.story.render()}
            </SlotsTakeTheScreen.Provider>
          </QuestionsHoldThePage.Provider>
        </div>
      ))}
    </div>
  </article>
)

export const TheGallery = (props: {
  files: readonly AFileShown[]
  shows: WhatItShows
  texts: typeof the_gallery
}) => {
  const shows = props.shows
  if (shows.shows === 'a_story') {
    const story = props.files
      .flatMap((file) => file.stories)
      .find((each) => each.id === shows.story)
    return (
      <main class="gallery" data-state="a_story">
        {story === undefined ? (
          <p role="alert">{props.texts.no_such_story(shows.story)}</p>
        ) : (
          <AStory story={story} themes={shows.themes} texts={props.texts} />
        )}
        <p data-part="all">
          <a href="?">{props.texts.all_the_stories}</a>
        </p>
      </main>
    )
  }
  return (
    <main class="gallery" data-state="everything">
      <header>
        <h1>{props.texts.title}</h1>
        <p>{props.texts.intro}</p>
        <nav>
          <ul>
            {props.files.map((file) => (
              <li key={file.id}>
                <a href={`#${file.id}`}>{file.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {props.files.map((file) => (
        <section key={file.id} id={file.id} aria-label={file.title}>
          <h2>{file.title}</h2>
          {file.stories.map((story) => (
            <AStory key={story.id} story={story} themes={both} texts={props.texts} />
          ))}
        </section>
      ))}
    </main>
  )
}
