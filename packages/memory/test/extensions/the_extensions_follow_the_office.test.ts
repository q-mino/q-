import { expect, test } from 'vitest'
import { a_node, a_story, until } from '../node/harness.ts'

// The extensions follow the office (EXT-15, USR-9; step 17): the phone's
// consumer loads an extension when its user activates it and unloads it at
// her deactivation, the office only recording the facts; started where the
// extension is active, it loads it once caught up, as a node starts. Anna's
// phone of the `memory` stack, ping pong preinstalled and off (PNG-1).
// Friday 20 November 2026, 10:00 UTC.

test('an activation loads ping pong, a deactivation unloads it; a node that starts where it is active loads it', async () => {
  const story = await a_story()
  const anna = await a_node(story, {
    phone: 1,
    face_id: 'F_a',
    name: 'Anna',
    installed: 'ping_pong',
  })
  const life = () => anna.the_hosted().life().life
  const following = anna.the_extensions_follow_the_office()
  await anna.the_user('usecase/activate_an_extension', { manifest: anna.shown() })
  await until(() => life() === 'running', 'ping pong loaded at its activation')
  await anna.the_user('usecase/deactivate_an_extension', { extension: 'ping_pong' })
  await until(() => life() === 'unloaded', 'ping pong unloaded at its deactivation')
  await following.stop()
  // Activated while nothing follows the office: the office records it, nothing loads it.
  await anna.the_user('usecase/activate_an_extension', { manifest: anna.shown() })
  expect(life()).toBe('unloaded')
  const at_the_start = anna.the_extensions_follow_the_office()
  await until(() => life() === 'running', 'ping pong loaded at the node’s start')
  await at_the_start.stop()
  await anna.closes()
})
