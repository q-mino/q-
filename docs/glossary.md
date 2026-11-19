# Glossary

The code is in English; the app speaks Italian to its users (`packages/phone/src/texts/`), and the project's decisions are written in Italian. This table keeps the two vocabularies aligned. A new domain term enters here before it enters the code.

The terms of the architecture paper, which is in Italian, are in [Architecture terms](#architecture-terms); [`architecture.md`](architecture.md) uses them.

## Names

Lowercase, as written; read with a capital.

| written | read    | what                                                         |
| ------- | ------- | ------------------------------------------------------------ |
| `q-`    | Cumino  | the network, and this app                                    |
| `zen0`  | Zenzero | its library (`domains/src/library/`), the paper's _libreria_ |

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
| `generatore`                                      | `generator` (the compilation of the domains, DOM-25) |

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

| Italian (paper)                                     | English                                                                                                                                   | classical name                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| fatto                                               | fact                                                                                                                                      | domain event (DDD)                    |
| esito · rifiuto                                     | outcome · rejection                                                                                                                       |                                       |
| esito tecnico                                       | technical outcome                                                                                                                         | infrastructure failure                |
| `Chiamante` · chiamante interno                     | `Caller` · internal caller                                                                                                                | principal                             |
| caso d'uso (di comando · di lettura)                | use case (command · read)                                                                                                                 | primary port                          |
| porta (di comando · di lettura)                     | port (command port · read port)                                                                                                           | secondary port, repository (DDD)      |
| comando · ramo · condizione composta                | command · branch · composed condition                                                                                                     |                                       |
| predicato · vocabolario                             | predicate · vocabulary                                                                                                                    | specification (DDD)                   |
| query · selezione · campi · ordine                  | query · selection · fields · order                                                                                                        |                                       |
| predicato di selezione · soggetto                   | selection predicate · subject                                                                                                             |                                       |
| calcolo                                             | calculation (a value of the candidate, by the parameters of a read: SC-21)                                                                | derived field (D50.7)                 |
| pagina · cursore · totale                           | page · cursor · total (a read in pages: SC-22; the cursor of a step: DOM-20)                                                              | keyset pagination                     |
| candidato · voce (di q-)                            | candidate · entry                                                                                                                         |                                       |
| lettura dichiarata · forma istanza · forma insieme  | declared read · instance form · set form                                                                                                  |                                       |
| percorso · tipo (di un costrutto) · interpretazione | path · kind (of a construct) · interpretation (`dsl`)                                                                                     |                                       |
| identità · formato · brand                          | identity (module `id`) · format · brand                                                                                                   | branded (nominal) type                |
| busta (degli eventi)                                | event envelope                                                                                                                            |                                       |
| identità dell'operazione · impronta                 | operation id · fingerprint                                                                                                                | idempotency key                       |
| ramo del duplicato                                  | duplicate branch                                                                                                                          |                                       |
| voce in outbox · caso d'uso di rientro              | outbox entry · return use case                                                                                                            | transactional outbox                  |
| effetto · attesa                                    | effect · wait (an effect with no world, its payload back to its return)                                                                   | timer, scheduled message              |
| esecutore di effetti                                | effect executor                                                                                                                           |                                       |
| reazione                                            | reaction                                                                                                                                  | policy (Event Storming)               |
| procedura (q-, not the paper's)                     | procedure: the reactions to one occurrence of the business, a folder of `reaction/` (GR-9)                                                |                                       |
| processo                                            | process                                                                                                                                   | process manager, saga                 |
| lettura sul flusso · allineato                      | stream read · caught up                                                                                                                   | catch-up subscription                 |
| registro dei fatti · stream nativo · composto       | fact log · native · composed stream                                                                                                       | event log, change data capture        |
| traduzione (di un fatto)                            | translation                                                                                                                               | upcasting                             |
| proiezione                                          | projection                                                                                                                                | read model                            |
| persona · cappello                                  | persona · hat (the persona worn)                                                                                                          |                                       |
| albero di casi d'uso                                | use-case tree                                                                                                                             |                                       |
| nodo · contesto (di un nodo)                        | node · context                                                                                                                            |                                       |
| bersaglio · condizione del percorso                 | target · condition of the path (`binds`, `requires`: a node of a business tree, SC-31)                                                    | guard (D105)                          |
| applicabilità · azione                              | applicability (`wlib.Applicability`) · action (`actions` of a read leaf, SC-33)                                                           | precondition check                    |
| non noto · dato dal chiamante                       | not known (`'not_known'`, D51.4) · given by the caller (`wlib.given_by_the_caller`)                                                       | three-valued logic                    |
| attore non umano · identità dell'operazione         | actor from outside (`persona/workshop/`, a `Caller` by a key, SC-34) · the operation's identity (`operation.identity` of a leaf, D91.2)   | API client, webhook · idempotency key |
| domanda (di auth, di q-)                            | lookup                                                                                                                                    | key-value lookup                      |
| porta (di una cartella, per un pubblico, di q-)     | door (`_door_persona.ts`; to the folders below, `_door_below.ts`)                                                                         |                                       |
| ambito (di una cartella, di un tipo, di q-)         | scope (`_scope.ts`, of the folder; `_scope_command.ts`, one per kind of construct)                                                        |                                       |
| mappa della vista (di q-)                           | sight (`sight.ts`, `wlib.Sight`): what a folder sees of the others                                                                        |                                       |
| vincolo di perimetro · vincolo di limite            | perimeter constraint · limit constraint                                                                                                   | 404 instead of 403 · 403 with reason  |
| visitatore                                          | visitor                                                                                                                                   | anonymous session                     |
| interfaccia · contratto                             | interface · contract                                                                                                                      | inbound adapter                       |
| dati sulla richiesta · pila · frame                 | request data · frame stack · frame                                                                                                        |                                       |
| dominio utente · attività · concetto utente         | user domain · activity · user concept                                                                                                     |                                       |
| adapter di trasporto                                | transport adapter                                                                                                                         |                                       |
| configuratore · verifica di composizione            | configurator · composition check                                                                                                          | composition root                      |
| libreria · nucleo · innesco                         | library · nucleus · trigger                                                                                                               |                                       |
| interprete di riferimento                           | reference interpreter (in q-, the oracle: V10)                                                                                            |                                       |
| suite di conformità · oracolo                       | conformance suite · oracle                                                                                                                | TCK · test oracle                     |
| capacità (di un adapter) · capacità obbligatorie    | capability · mandatory capabilities                                                                                                       |                                       |
| attore                                              | actor                                                                                                                                     |                                       |
| traccia                                             | trace (`wlib.Trace`, `wlib.Traced`: a request a tree answered with no fact, with why, for the user of the node; F6, PER-14)               |                                       |
| dead-letter                                         | dead letter                                                                                                                               |                                       |
| fatto fermo · fatto in attesa dietro                | a dead letter holds its resources · waiting part (SC-42)                                                                                  | D94.7, D67.3                          |
| voce ferma · voce in attesa dietro                  | an executor's dead letter holds its entry's resources · waiting entry (SC-53)                                                             | D108, D67.3                           |
| tollera il riordino (un consumatore)                | an effect whose order is `any`: its dead letters hold nothing (SC-56)                                                                     | D67.3                                 |
| ricorrenza                                          | recurrence: a wait whose return queues the next (SC-43)                                                                                   | D68.3, D48                            |
| parte interna (di un'istanza)                       | internal part: the line of an order, of its instance's resource; a list loaded element by element is a process over its parts (SC-44)     | D94.1                                 |
| transizione su una lista                            | a transition composed on each element of a list (`each`): a list of named instances loaded in one go (SC-54)                              | D113                                  |
| evento di base · posizione                          | base event · position                                                                                                                     |                                       |
| risorsa (di un fatto) · identità della voce         | resource · identity of an entry (a query's, LIB-9)                                                                                        |                                       |
| risorse dichiarate (di un fatto)                    | declared resources: the fields of a fact's payload that carry the instances it changes and its target, in place of every identity (SC-55) | D94.6                                 |
| registro (delle regole dell'interprete)             | registry                                                                                                                                  |                                       |
| registro dei percorsi (di q-)                       | path registry (`registry.ts`)                                                                                                             |                                       |
| registro per major · verso (di una forma)           | registry by major (`_registry.json`) · direction of a shape: read by the tree, given to its clients, carried by others (DOM-24)           | PER-17                                |
| guasto di composizione                              | composition fault                                                                                                                         |                                       |

Two names that collide in Italian: the paper's _busta_ is the **event envelope**; q-'s _busta_ (what the relay sees) is the **envelope**. The paper's _nucleo_ is the **nucleus**; the _core_ is the pure part of a domain.

The paper's _soggetto_ has two senses: what a query speaks of (D50.1, D64.1), and on whose behalf one acts (D87.1). q- keeps only the first: **subject** is always a query's, a view named by the business, where the paper's is an aggregate (V12). A **candidate** is an instance of the subject that a selection looks at; an **entry** is what the query returns of a candidate it keeps (its fields). Both are q-'s words, not the paper's.

## Personas of q-

| Italian                                             | English                                    |
| --------------------------------------------------- | ------------------------------------------ |
| io · volto conosciuto · volto sconosciuto · anonimo | `self` · `known` · `unknown` · `anonymous` |
