// adapters-web: one folder per adapter, each imported only through its index.ts.
export { the_device_s_clock, the_device_s_zone, the_time_that_passes } from './clock/index.ts'
export {
  ids_drawn_at_random,
  the_bytes_of_an_id,
  type CryptographicRandomness,
} from './randomness/index.ts'
