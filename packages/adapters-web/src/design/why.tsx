// Why (WEB-27): the reason of a fault, whole, folded under its title
// («Perché»): sober, there for whom asks, never in her way. [Q, C, 24 Nov 2026]

export const Why = (props: { title: string; message: string }) => (
  <details class="why">
    <summary>
      <h2>{props.title}</h2>
    </summary>
    <pre>{props.message}</pre>
  </details>
)
