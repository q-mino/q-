// Qr (WEB-27): a QR she shows, large and centred, dark on its own white
// paper in both themes, with its quiet zone, as a camera reads it best.
// [Q, C, 24 Nov 2026]

export const Qr = (props: {
  /** The QR's SVG, as the screen draws it. */
  svg: string
  /** What it is, for a screen reader. */
  label: string
}) => (
  <figure class="qr">
    <img alt={props.label} src={`data:image/svg+xml,${encodeURIComponent(props.svg)}`} />
  </figure>
)
