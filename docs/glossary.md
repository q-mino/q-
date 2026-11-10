# Glossary

The code is in English; the app speaks Italian to its users (`packages/phone/src/texts/`), and the project's decisions are written in Italian. This table keeps the two vocabularies aligned. A new domain term enters here before it enters the code.

The terms of the architecture paper, which is in Italian, are in [Architecture terms](#architecture-terms); [`architecture.md`](architecture.md) uses them.

## Packages and folders

| Italian                                           | English                                              |
| ------------------------------------------------- | ---------------------------------------------------- |
| `domini`                                          | `domains`                                            |
| `libreria/`                                       | `library/`                                           |
| `sigilli` · `posta` · `casella`                   | `seals` · `post` · `mailbox`                         |
| sportello                                         | `desk` (the persona layer of `mailbox`)              |
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

## Architecture terms

From the paper _Architettura a domini_. Where the paper maps a classical name, it is in the last column.

| Italian (paper)                                    | English                                             | classical name                       |
| -------------------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| fatto                                              | fact                                                | domain event (DDD)                   |
| esito · rifiuto                                    | outcome · rejection                                 |                                      |
| esito tecnico                                      | technical outcome                                   | infrastructure failure               |
| `Chiamante` · chiamante interno                    | `Caller` · internal caller                          | principal                            |
| caso d'uso (di comando · di lettura)               | use case (command · read)                           | primary port                         |
| porta (di comando · di lettura)                    | port (command port · read port)                     | secondary port, repository (DDD)     |
| comando · ramo · condizione composta               | command · branch · composed condition               |                                      |
| predicato · vocabolario                            | predicate · vocabulary                              | specification (DDD)                  |
| query · selezione · campi · ordine                 | query · selection · fields · order                  |                                      |
| predicato di selezione · soggetto · candidato      | selection predicate · subject · candidate           |                                      |
| lettura dichiarata · forma istanza · forma insieme | declared read · instance form · set form            |                                      |
| percorso · modulo convenzionale · interpretazione  | path · conventional module · interpretation (`dsl`) |                                      |
| busta (degli eventi)                               | event envelope                                      |                                      |
| identità dell'operazione · impronta                | operation id · fingerprint                          | idempotency key                      |
| ramo del duplicato                                 | duplicate branch                                    |                                      |
| voce in outbox · caso d'uso di rientro             | outbox entry · return use case                      | transactional outbox                 |
| esecutore di effetti                               | effect executor                                     |                                      |
| reazione                                           | reaction                                            | policy (Event Storming)              |
| processo                                           | process                                             | process manager, saga                |
| lettura sul flusso · allineato                     | stream read · caught up                             | catch-up subscription                |
| traduzione (di un fatto)                           | translation                                         | upcasting                            |
| proiezione                                         | projection                                          | read model                           |
| persona · cappello                                 | persona · hat (the persona worn)                    |                                      |
| albero di casi d'uso                               | use-case tree                                       |                                      |
| vincolo di perimetro · vincolo di limite           | perimeter constraint · limit constraint             | 404 instead of 403 · 403 with reason |
| visitatore                                         | visitor                                             | anonymous session                    |
| interfaccia · contratto                            | interface · contract                                | inbound adapter                      |
| dati sulla richiesta · pila · frame                | request data · frame stack · frame                  |                                      |
| dominio utente · attività · concetto utente        | user domain · activity · user concept               |                                      |
| adapter di trasporto                               | transport adapter                                   |                                      |
| configuratore · verifica di composizione           | configurator · composition check                    | composition root                     |
| libreria · nucleo · innesco                        | library · nucleus · trigger                         |                                      |
| interprete di riferimento                          | reference interpreter                               |                                      |
| suite di conformità · oracolo                      | conformance suite · oracle                          | TCK · test oracle                    |
| capacità (di un adapter) · capacità obbligatorie   | capability · mandatory capabilities                 |                                      |
| attore · soggetto                                  | actor · subject (on behalf of)                      |                                      |
| traccia                                            | trace                                               |                                      |
| dead-letter                                        | dead letter                                         |                                      |
| evento di base · posizione                         | base event · position                               |                                      |
| registro (delle regole dell'interprete)            | registry                                            |                                      |
| guasto di composizione                             | composition fault                                   |                                      |

Two names that collide in Italian: the paper's _busta_ is the **event envelope**; Q-'s _busta_ (what the relay sees) is the **envelope**. The paper's _nucleo_ is the **nucleus**; the _core_ is the pure part of a domain.

## Personas of Q-

| Italian                                             | English                                    |
| --------------------------------------------------- | ------------------------------------------ |
| io · volto conosciuto · volto sconosciuto · anonimo | `self` · `known` · `unknown` · `anonymous` |
