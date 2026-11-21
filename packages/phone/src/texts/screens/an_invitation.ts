import type { AnInvitationTexts } from '@q-mino/adapters-web/screens'

// An invitation, a link she opened (provisional, A to confirm).
export const an_invitation = {
  title: 'Un invito',
  not_an_invitation:
    'Questo link non porta un invito che si apra: è guasto. Chiedine un altro a chi te l’ha mandato.',
  wants_to_shake_your_hand: (name) => `${name} vuole stringerti la mano, a distanza.`,
  if_you_accept: 'Se accetti, diventate contatti.',
  the_name_you_give: 'Il nome nei tuoi contatti',
  accept: 'Accetta',
  decline: 'No, grazie',
  on_its_way: (name) => `Stringo la mano a ${name}…`,
  it_waits_offline: 'Senza rete aspetta: parte da solo appena torna.',
  bonded: (name) => `Hai ${name}, a distanza.`,
  bonded_already: (name) => `${name} era già tra i tuoi contatti.`,
  no_longer_holds: (name) => `L’invito di ${name} non vale più.`,
} satisfies AnInvitationTexts
