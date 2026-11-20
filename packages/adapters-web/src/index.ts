// adapters-web: one folder per adapter, each imported only through its index.ts.
export { the_device_s_clock, the_device_s_zone, the_time_that_passes } from './clock/index.ts'
export {
  ids_drawn_at_random,
  the_bytes_of_an_id,
  type CryptographicRandomness,
} from './randomness/index.ts'
export {
  the_link_of_a_ticket,
  the_ticket_in_a_link,
  the_mark_of_a_ticket,
  type ALinksTicket,
} from './ticket_link/index.ts'
export {
  the_qr_of,
  the_svg_of,
  the_texts_seen,
  the_text_in,
  the_bytes_a_qr_holds,
  a_look_every,
  type AQr,
  type Modules,
  type AFrame,
  type ALook,
} from './qr/index.ts'
export {
  scan_with_the_rear_camera,
  open_the_rear_camera,
  why_not_on,
  the_rear_camera_s_constraints,
  type AScan,
  type AnOpenedCamera,
  type NotOn,
} from './camera/index.ts'
