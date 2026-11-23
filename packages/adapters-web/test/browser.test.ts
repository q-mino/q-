import { expectTypeOf, test } from 'vitest'
import type {
  AFetch,
  ANavigatorOnLine,
  APageToPickIn,
  APageToSaveIn,
  AWindowOfTheNetwork,
  CryptographicRandomness,
  the_device_s_clock,
} from '../src/index.ts'
import type * as zz from '@q-mino/domains/library'

// The browser's own objects are what the adapters take (WEB-5): the
// configurator gives `document`, `URL`, `crypto`, `navigator.mediaDevices`,
// `fetch`, `navigator` and `window` as they are, with no wrapper and no cast.
// Checked by the compiler, on the DOM's types; Node has none of them at
// runtime.

test("the browser's objects are what the adapters take", () => {
  expectTypeOf<Document>().toExtend<APageToSaveIn['document']>()
  expectTypeOf<typeof URL>().toExtend<APageToSaveIn['urls']>()
  expectTypeOf<Document>().toExtend<APageToPickIn['document']>()
  expectTypeOf<Crypto>().toExtend<CryptographicRandomness>()
  expectTypeOf<ReturnType<typeof the_device_s_clock>>().toEqualTypeOf<zz.Clock>()
  expectTypeOf<typeof fetch>().toExtend<AFetch>()
  expectTypeOf<Navigator>().toExtend<ANavigatorOnLine>()
  expectTypeOf<Window>().toExtend<AWindowOfTheNetwork>()
})
