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
  her_node_over,
  type HerNode,
  type HerNodesWiring,
  type HerTicket,
  type ThePartsOfHerNode,
  type TheNewsOfHerNode,
  type TheUsersPorts,
} from './her_node/index.ts'
export {
  the_link_of_a_ticket,
  the_ticket_in_a_link,
  the_mark_of_a_ticket,
  type ALinksTicket,
} from './ticket_link/index.ts'
export {
  the_fragment_of_a_view,
  the_mark_of_a_view,
  the_view_in_a_fragment,
  the_view_in_a_link,
  the_way_to_a_view,
  type AViewsLink,
  type TheViewsWords,
} from './view_link/index.ts'
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
export {
  delete_the_node_s_database,
  open_the_node_s_database,
  ask_to_be_the_writer,
  the_writer_s_lock,
  ask_to_keep_the_storage,
  on_indexeddb,
  the_node_s_storage,
  type AnIndexedDb,
  type AKeyRange,
  type TheNodesDatabase,
  type WhyItClosed,
  type ALockManager,
  type HowToAsk,
  type TheWriter,
  type WhyNotAnyMore,
  type AStorageManager,
  type TheStorage,
  type TheBrowsersStorage,
  type TheNodeOnIndexedDb,
  type TheNodeOpened,
} from './indexeddb/index.ts'
