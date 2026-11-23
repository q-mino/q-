// adapters-web: one folder per adapter, each imported only through its index.ts.
export { the_device_s_clock, the_device_s_zone, the_time_that_passes } from './clock/index.ts'
export {
  the_device_s_network,
  type ANavigatorOnLine,
  type AWindowOfTheNetwork,
  type TheDeviceSNetwork,
  type TheNetworkTold,
} from './network/index.ts'
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
  scan_with_a_camera,
  the_camera,
  open_a_camera,
  why_not_on,
  the_constraints_of,
  type AScan,
  type AnOpenedCamera,
  type AFacing,
  type AStream,
  type TheCamera,
  type TheCameras,
  type TheMediaDevices,
  type NotOn,
} from './camera/index.ts'
export {
  save_a_file,
  pick_a_file,
  a_saved_file_s_minute,
  type AFile,
  type APick,
  type AFileInput,
  type APageToSaveIn,
  type APageToPickIn,
} from './files/index.ts'
export {
  the_relay_s_http_transports,
  the_longest_wait_for_the_relay,
  the_paths_of_the_relay,
  type AFetch,
  type ARequest,
  type AnAnswer,
  type TheRelaysHttpWiring,
  type TheRelayAsMet,
  type TheRelayMet,
} from './relay_client/index.ts'
