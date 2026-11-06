# Glossary

The code is in English; the app speaks Italian to its users (`packages/phone/src/texts/`), and the project's decisions are written in Italian. This table keeps the two vocabularies aligned. A new domain term enters here before it enters the code.

The terms of the architecture paper (fact, outcome, caller, use case, effect executor, configurator…) are fixed by [`architecture.md`](architecture.md).

## Packages and folders

| Italian                                           | English                                              |
| ------------------------------------------------- | ---------------------------------------------------- |
| `domini`                                          | `domains`                                            |
| `libreria/`                                       | `library/`                                           |
| `sigilli` · `posta` · `casella`                   | `seals` · `post` · `mailbox`                         |
| `legami` · `conversazioni`                        | `bonds` · `conversations`                            |
| `auth` · `persona` · `utente` · `ui`              | `auth` · `persona` · `user` · `ui`                   |
| `adapter-comuni` · `adapter-web` · `adapter-node` | `adapters-common` · `adapters-web` · `adapters-node` |
| `telefono` · `relay` · `memoria`                  | `phone` · `relay` · `memory`                         |

## Domain terms

| Italian                                                           | English                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------- |
| volto · seme · Cambia volto                                       | face · seed · change face                            |
| busta · lettera · ricevuta · dichiarazione                        | envelope · letter · receipt · declaration            |
| biglietto · stretta di mano · presentazione                       | ticket · handshake · introduction                    |
| legame · contatto · invitato                                      | bond · contact · invitee                             |
| gruppo · appartenenza · membro · canale                           | group · membership · member · channel                |
| deposita · ritira · indirizzo di deposito D · segreto di ritiro R | deposit · collect · deposit address · collect secret |
| sigilla · apri · firma · verifica                                 | seal · open · sign · verify                          |
| annotazione · di persona                                          | annotation · in person                               |
| esportazione · trasloco d'origine                                 | export · origin relocation                           |
| a riposo · ammutolito                                             | resting · muted                                      |

Choices: `post`, not `mail` (it suggests email); `ticket` for the biglietto (single use, with an expiry); `bonds`, not `links` (ambiguous in code).
