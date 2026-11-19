// Concurrency equal to some serial order (TST-5, DOM-9): requests sent at
// the same time give the outcomes of one of their serial orders. A scenario
// writes each request as a function of a shed, so that it runs on a fresh
// one in every order; the shed's operations are named, so that a request is
// the same in each.

/** A request a scenario sends, on the shed it is given. */
export type Request<shed, outcome> = (shed: shed) => Promise<outcome>

/** Every order of a list. */
export const orders = <item>(items: readonly item[]): readonly (readonly item[])[] =>
  items.length <= 1
    ? [items]
    : items.flatMap((item, i) =>
        orders([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
      )

/** The outcomes of the requests sent one after the other in an order, each in its place in the list. */
const one_after_the_other = async <shed, outcome>(
  shed: shed,
  requests: readonly Request<shed, outcome>[],
  order: readonly number[],
): Promise<readonly outcome[]> => {
  const outcomes = new Map<number, outcome>()
  for (const i of order) {
    const request = requests[i]
    if (request === undefined) throw new Error('an order names no request')
    outcomes.set(i, await request(shed))
  }
  return requests.map((_, i) => {
    const outcome = outcomes.get(i)
    if (outcome === undefined) throw new Error('a request was not sent')
    return outcome
  })
}

/** The outcomes of every serial order of the requests, each on a fresh shed. */
export const serially = async <shed, outcome>(
  fresh: () => Promise<shed>,
  requests: readonly Request<shed, outcome>[],
): Promise<readonly (readonly outcome[])[]> => {
  const all: (readonly outcome[])[] = []
  for (const order of orders(requests.map((_, i) => i))) {
    all.push(await one_after_the_other(await fresh(), requests, order))
  }
  return all
}

/** The outcomes of the requests sent at the same time, on a fresh shed. */
export const at_once = async <shed, outcome>(
  fresh: () => Promise<shed>,
  requests: readonly Request<shed, outcome>[],
): Promise<readonly outcome[]> => {
  const shed = await fresh()
  return Promise.all(requests.map((request) => request(shed)))
}
