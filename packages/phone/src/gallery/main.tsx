// The gallery's main (WEB-28): its page, `galleria.html`, composed on every
// channel but the release's (`build/compose.ts`). It reads what its address
// asks (`?story=<id>&theme=light|dark`), draws the stories, and marks the
// page ready for the screenshots' script. No node, no worker of its own:
// the stories draw from their own data. [Q, C, 24 Nov 2026]

import { render } from 'preact'
import { the_gallery } from '../texts/index.ts'
import { the_files } from './the_stories.ts'
import { TheGallery, type ATheme, type WhatItShows } from './the_gallery.tsx'

const what_it_shows = (search: URLSearchParams): WhatItShows => {
  const story = search.get('story')
  if (story === null) return { shows: 'everything' }
  const theme = search.get('theme')
  const themes: readonly ATheme[] =
    theme === 'light' ? ['light'] : theme === 'dark' ? ['dark'] : ['light', 'dark']
  return { shows: 'a_story', story, themes }
}

const root = document.getElementById('root')
if (root === null) throw new Error('missing #root')
render(
  <TheGallery
    files={the_files}
    shows={what_it_shows(new URLSearchParams(location.search))}
    texts={the_gallery}
  />,
  root,
)
document.documentElement.dataset['ready'] = 'yes'
