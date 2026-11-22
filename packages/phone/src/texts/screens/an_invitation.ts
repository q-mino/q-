import type { AnInvitationTexts } from '@q-mino/adapters-web/screens'

// An invitation, a link she opened (Alessandro, 22 Nov 2026 [Q, A, 22 Nov 2026]; to be reviewed on the phones at step 27).
export const an_invitation = {
  title: 'Un invito',
  not_an_invitation:
    'Questo link non porta un invito che si apra: è guasto. Chiedine un altro a chi te l’ha mandato.',
  wants_to_shake_your_hand: (name) => `${name} vuole stringerti la mano, a distanza.`,
  if_you_accept:
    'Se accetti, è tra i tuoi contatti; tu sarai tra i suoi quando gli arriva la tua presentazione.',
  the_name_you_give: 'Il nome nei tuoi contatti',
  accept: 'Accetta',
  decline: 'No, grazie',
  on_its_way: (name) => `Stringo la mano a ${name}…`,
  it_waits_offline: 'Senza rete aspetta: parte da solo appena torna.',
  bonded: (name) => `Nuovo contatto: si presenta come ${name}, a distanza.`,
  // [Q, C, provisional: A to confirm]: as the bond made, no identity claimed (WEB-20).
  bonded_already: (name) => `Era già tra i tuoi contatti: si presenta come ${name}.`,
  no_longer_holds: (name) => `L’invito di ${name} non vale più.`,
} satisfies AnInvitationTexts
