// Viewfinder (WEB-27): where the camera shows what it sees while she scans,
// its corners drawn over it, so that she knows where to hold the other QR.
// It holds the video the screen gives the camera. [Q, C, 24 Nov 2026]

import type { ComponentChildren } from 'preact'

export const Viewfinder = (props: { hidden: boolean; children: ComponentChildren }) => (
  <div class="viewfinder" hidden={props.hidden}>
    {props.children}
    <span data-part="corners" aria-hidden="true" />
  </div>
)
