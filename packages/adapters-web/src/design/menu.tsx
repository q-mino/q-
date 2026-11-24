// Menu (WEB-27): the entries of a screen she opens and closes, drawn over it
// as a popover (`popover="auto"`): the browser closes it at a tap outside or
// at Escape, and tells it, so that the screen's state closes it too. Open
// while it is drawn: the screen's state says whether it is (UI-1). A browser
// without popovers draws it in its place. [Q, C, 24 Nov 2026]

import type { ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'

export const Menu = (props: {
  label: string
  /** The browser closed it (a tap outside, Escape). */
  closes: () => void
  children: ComponentChildren
}) => {
  const the_menu = useRef<HTMLElement>(null)
  const closes = useRef(props.closes)
  closes.current = props.closes
  useEffect(() => {
    const menu = the_menu.current
    if (menu === null || !('showPopover' in menu)) return
    const closed = (event: Event): void => {
      if (event instanceof ToggleEvent && event.newState === 'closed' && menu.isConnected)
        closes.current()
    }
    menu.addEventListener('toggle', closed)
    menu.showPopover()
    return () => {
      menu.removeEventListener('toggle', closed)
    }
  }, [])
  return (
    <nav class="menu" aria-label={props.label} popover="auto" ref={the_menu}>
      {props.children}
    </nav>
  )
}
