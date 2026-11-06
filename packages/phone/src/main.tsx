import { render } from 'solid-js/web'
import { App } from './App.tsx'

const root = document.getElementById('root')
if (root === null) throw new Error('missing #root')
render(() => <App />, root)
