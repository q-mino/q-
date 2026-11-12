// generated

// The door of `auth/accounts` (DOM-25): what the folder exposes to whoever is
// outside it, flat, under the components' names. An auth domain's door
// exposes its lookups and its identities, by the architecture's rule (PER-9,
// PER-10): a persona reads them, the business never imports them. Inside the
// folder the files import the twins, never the door.

export { the_hats_of_an_account, the_member_card_of_an_account } from './_lookup.ts'
export { account_id, card_id } from './_id.ts'
