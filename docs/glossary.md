# Glossary

The code is in English; the app speaks Italian to its users (`packages/phone/src/texts/`), and the project's decisions are written in Italian. This table keeps the two vocabularies aligned. A new domain term enters here before it enters the code.

The terms of the architecture paper, which is in Italian, are in [Architecture terms](#architecture-terms); [`architecture.md`](architecture.md) uses them.

## Names

Lowercase, as written; read with a capital.

| written | read    | what                                                                           |
| ------- | ------- | ------------------------------------------------------------------------------ |
| `q-`    | Cumino  | the network, and this app                                                      |
| `zen0`  | Zenzero | its library (`domains/src/library/`), the paper's _libreria_, imported as `zz` |

## Packages and folders

| Italian                                                             | English                                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `domini`                                                            | `domains`                                                                                              |
| `libreria/`                                                         | `library/`                                                                                             |
| `sigilli` · `posta` · `casella`                                     | `seals` · `post` · `mailbox`                                                                           |
| sportello                                                           | `desk` (the persona layer of `mailbox`)                                                                |
| `legami` · `estensioni`                                             | `bonds` · `extensions`                                                                                 |
| `auth` · `persona` · `utente` · `ui`                                | `auth` · `persona` · `user` · `ui`                                                                     |
| `adapter-comuni` · `adapter-web` · `adapter-node`                   | `adapters-common` · `adapters-web` · `adapters-node`                                                   |
| `telefono` · `relay` · `memoria`                                    | `phone` · `relay` · `memory`                                                                           |
| `generatore`                                                        | `generator` (the compilation of the domains, DOM-25)                                                   |
| `confine`                                                           | `boundary` (the package of the kernel's contract with its extensions, EXT-9)                           |
| `estensioni/<nome>`                                                 | `extensions/<name>` (the package of an extension, EXT-9)                                               |
| `casella/depositi` · `sportello/depositante` · `sportello/titolare` | `mailbox/deposits` · `desk/depositor` · `desk/holder` (the relay's domain and its two personas, MBX-1) |

## Domain terms

| Italian                                                           | English                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------- |
| volto · seme · Cambia volto                                       | face · seed · change face                                      |
| busta · lettera · ricevuta · dichiarazione                        | envelope · letter · receipt · declaration                      |
| biglietto · stretta di mano · presentazione                       | ticket · handshake · introduction                              |
| legame · contatto · invitato                                      | bond · contact · invitee                                       |
| gruppo · appartenenza · membro · canale                           | group · membership · member · channel                          |
| deposita · ritira · indirizzo di deposito D · segreto di ritiro R | deposit · collect · deposit address · collect secret           |
| sigilla · apri · firma · verifica                                 | seal · open · sign · verify                                    |
| annotazione · di persona                                          | annotation · in person                                         |
| esportazione · trasloco d'origine                                 | export · origin relocation                                     |
| a riposo · ammutolito                                             | resting · muted                                                |
| nucleo (di Cumino) · estensione · manifest                        | kernel · extension · manifest                                  |
| punto di aggancio: hook · pagina · slot · azione                  | extension point: hook · page · slot · action                   |
| preinstallata · installata · attiva · disattiva l'estensione      | preinstalled · installed · activate · deactivate the extension |
| offerta a un legame · revoca l'offerta                            | offered to a bond · withdraw the offer                         |
| confine (di un'estensione) · invocazione                          | boundary · invocation                                          |
| porta delle richieste · rientro (di una richiesta)                | port of requests · return (of a request)                       |
| isolata · nello stesso processo                                   | isolated · in process                                          |
| in tutto o in parte · parte (di un'estensione)                    | whole or in part · part (with its case, EXT-13)                |
| versione del confine · partizione                                 | boundary version · partition (an extension's storage)          |
| caricata · pronta · avviata · fermata (un'estensione)             | loaded · ready · started · stopped                             |
| luogo (di un punto di aggancio) · riquadro                        | place (of an extension point) · frame                          |
| cornice (di un'estensione)                                        | mark (the kernel's, EXT-16)                                    |
| estensioni in comune                                              | extensions in common                                           |
| richiesta · risposta · nessuna risposta                           | request · response · no response                               |
| tace (un nodo)                                                    | stays silent                                                   |
| relay preferiti                                                   | preferred relays                                               |
| ping · pong                                                       | ping · pong                                                    |
| deposito (una busta su D) · scarta (dopo sette giorni)            | deposit (an envelope on D) · discard (after seven days)        |
| depositante · titolare (della casella, chi mostra R)              | depositor · holder (of a mailbox, who shows R)                 |

The relay's words (part 8.1, MBX-1..MBX-4, Claude, 20 Nov 2026): a **deposit** is an envelope left on a deposit address D, with the time the relay received it; the relay **discards** it seven days after, collected or not. Whoever deposits is a **depositor**, anyone; whoever shows the collect secret R of the mailbox at D = hash(R) is its **holder**, and collects. The relay's domain is `mailbox/deposits`, its personas `desk/depositor` and `desk/holder`. Rejected: `box` (a second word for the mailbox), `sender` (the relay knows no sender, F2, and a depositor need not be one).

Choices: `post`, not `mail` (it suggests email); `ticket` for the biglietto (single use, with an expiry); `bonds`, not `links` (ambiguous in code); `kernel` for Cumino's nucleo, not `nucleus` (the paper's, of the library) nor `core` (the pure part of a domain) (Alessandro, 19 Nov 2026). `conversations` (`conversazioni`) is no longer a domain of the kernel: messaging is the first extension after stage 1 (Alessandro, 19 Nov 2026).

What the words of the kernel mean (Alessandro, 19 Nov 2026; their rules come with the extensions' step of [`plan.md`](plan.md)):

- The **kernel** is what every node of Cumino has: faces, bonds, letters, relays, and the entry of a request (auth and the personas). Every other feature is an **extension**, which brings its domains and adds leaves to the personas' trees; two nodes speak through an extension when one has the side that asks and the other the side that serves.
- An extension's **manifest** declares what it sees of the kernel and of the other extensions, what it touches, the leaves it adds to which personas and the use cases it offers to other extensions; the kernel enforces it. An extension is **isolated** by default (it speaks to the kernel by messages only, its storage a partition the kernel gives it); one **in process** is a declared choice of trust, which the user accepts informed of its risks, whole or in part.
- An **extension point** is where the kernel lets an extension in: a page, a slot, an action; a hook, a programmatic one, only where a case shows it is needed.
- A **request** is a letter that invokes a use case of a face bonded to the sender. A **response** is the remote form of the leaf's projection: a letter back that names the request it answers, received as the return of that request; a response asks for no response. Whether a feature answers by a response or by a request of its own is the feature's choice.
- A node **stays silent** when it has not the extension invoked, or does not offer it to that bond, and the two cases look the same from outside; the node that asked waits for a time, then says **no response**.
- The **extensions in common** of two known faces are read through a use case of the kernel, offered to the persona `known`.
- **Ping pong** is the first extension, **preinstalled** and off until the user activates it: a ping is a request, the pong its response.

Their rules are F7, F8 and EXT-1..EXT-8 of [`architecture.md`](architecture.md) (step 12's design, Claude, 20 Nov 2026), with these words:

- The **boundary** of an extension is the messages between it and the kernel: an **invocation** of one of its leaves in, the leaf's events out, its calls to the kernel's ports (EXT-2); and its life (ready, started, stopped), its frames' messages, and its notices, its dead letters and trace shown in its mark.
- An extension is **installed** when the node has it (in stage 1 the app's composition); **activated** and **deactivated** by the user, who accepts its manifest; **offered to a bond** while active, to every bond but those the user **withdraws the offer** from (EXT-7).
- A silence, an undeclared call and a response not awaited go to the **kernel's trace**, the trace of its entry, beside the trees' (EXT-6), with why: inside the node nothing happens in silence (F6).
- The **port of requests** is the kernel's: it sends a request on a bond and answers with its response, or `no_response` after the time the asker set; the response comes back as the **return** of the request, its effect's return use case (F7). Its answer is closed: the response, `no_response`, the bond gone, or refused (the call undeclared, the extension not active or not offered to that bond); it keeps each answer under the request's **identity**, which the kernel composes from the effect and the entry's id (F7, EXT-2).

How an extension is built and loaded (part 12.2, EXT-9..EXT-16):

- An extension is a **package** of its own (`packages/extensions/ping_pong/`), whose root is its tree; it imports its library, `zod` and the **`boundary`** package, the kernel's contract with its extensions (EXT-9). The **boundary version** is that contract's, in a window the kernel speaks.
- Its **manifest** is its declaration (`manifest.ts`) and its surface, which the build derives from its tree (EXT-10).
- **Isolated**, it runs in a realm that reaches nothing of the node but the boundary, and the network only as far as the browser leaves it open, a limit declared to the user; **in process**, a choice of trust the user accepts informed; what runs in process, **whole or in part**, comes with its case (EXT-13). Its storage is a **partition** of the node's, which only it reads and writes (EXT-14).
- An extension is **loaded** only while it is active, says it is **ready**, and its consumers are **started** and **stopped** by the kernel (EXT-15).
- An extension point sits in a **place** of the kernel's screens (on a bond, in the extensions); an action is data the kernel draws, a slot or a page a **frame** the kernel places, with the extension's document in it; each in the kernel's **mark** of its extension, its name and a border (EXT-16).

## Architecture terms

From the paper _Architettura a domini_. Where the paper maps a classical name, it is in the last column.

| Italian (paper)                                     | English                                                                                                                                                                      | classical name                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| fatto                                               | fact                                                                                                                                                                         | domain event (DDD)                    |
| esito · rifiuto                                     | outcome · rejection                                                                                                                                                          |                                       |
| esito tecnico                                       | technical outcome                                                                                                                                                            | infrastructure failure                |
| `Chiamante` · chiamante interno                     | `Caller` · internal caller                                                                                                                                                   | principal                             |
| caso d'uso (di comando · di lettura)                | use case (command · read)                                                                                                                                                    | primary port                          |
| porta (di comando · di lettura)                     | port (command port · read port)                                                                                                                                              | secondary port, repository (DDD)      |
| comando · ramo · condizione composta                | command · branch · composed condition                                                                                                                                        |                                       |
| predicato · vocabolario                             | predicate · vocabulary                                                                                                                                                       | specification (DDD)                   |
| query · selezione · campi · ordine                  | query · selection · fields · order                                                                                                                                           |                                       |
| predicato di selezione · soggetto                   | selection predicate · subject                                                                                                                                                |                                       |
| calcolo                                             | calculation (a value of the candidate, by the parameters of a read: SC-21)                                                                                                   | derived field (D50.7)                 |
| pagina · cursore · totale                           | page · cursor · total (a read in pages: SC-22; the cursor of a step: DOM-20)                                                                                                 | keyset pagination                     |
| candidato · voce (di q-)                            | candidate · entry                                                                                                                                                            |                                       |
| lettura dichiarata · forma istanza · forma insieme  | declared read · instance form · set form                                                                                                                                     |                                       |
| percorso · tipo (di un costrutto) · interpretazione | path · kind (of a construct) · interpretation (`dsl`)                                                                                                                        |                                       |
| identità · formato · brand                          | identity (module `id`) · format · brand                                                                                                                                      | branded (nominal) type                |
| busta (degli eventi)                                | event envelope                                                                                                                                                               |                                       |
| identità dell'operazione · impronta                 | operation id · fingerprint                                                                                                                                                   | idempotency key                       |
| ramo del duplicato                                  | duplicate branch                                                                                                                                                             |                                       |
| voce in outbox · caso d'uso di rientro              | outbox entry · return use case                                                                                                                                               | transactional outbox                  |
| effetto · attesa                                    | effect · wait (an effect with no world, its payload back to its return)                                                                                                      | timer, scheduled message              |
| esecutore di effetti                                | effect executor (`effect_executor`: one delivery unit per effect, each entry when its `not_before` has come by its clock, DOM-14)                                            |                                       |
| reazione                                            | reaction (`reaction_consumers`: one durable consumer per reaction, each part of its fact under `reaction_operation`, from the fact's operation and the part, DOM-16)         | policy (Event Storming)               |
| procedura (q-, not the paper's)                     | procedure: the reactions to one occurrence of the business, a folder of `reaction/` (GR-9)                                                                                   |                                       |
| processo                                            | process                                                                                                                                                                      | process manager, saga                 |
| passo (di un processo) · istanza saltata            | step (`cursor_step`, DOM-20) · an instance passed over (no branch of its transition holds, D112.2)                                                                           | D112                                  |
| lettura sul flusso · allineato                      | stream read · caught up                                                                                                                                                      | catch-up subscription                 |
| registro dei fatti · stream nativo · composto       | fact log · native · composed stream                                                                                                                                          | event log, change data capture        |
| traduzione (di un fatto)                            | translation                                                                                                                                                                  | upcasting                             |
| proiezione                                          | projection                                                                                                                                                                   | read model                            |
| persona · cappello                                  | persona · hat (the persona worn)                                                                                                                                             |                                       |
| albero di casi d'uso                                | use-case tree                                                                                                                                                                |                                       |
| nodo · contesto (di un nodo)                        | node · context                                                                                                                                                               |                                       |
| bersaglio · condizione del percorso                 | target · condition of the path (`binds`, `requires`: a node of a business tree, SC-31)                                                                                       | guard (D105)                          |
| applicabilità · azione                              | applicability (`zz.Applicability`) · action (`actions` of a read leaf, SC-33)                                                                                                | precondition check                    |
| non noto · dato dal chiamante                       | not known (`'not_known'`, D51.4) · given by the caller (`zz.given_by_the_caller`)                                                                                            | three-valued logic                    |
| attore non umano · identità dell'operazione         | actor from outside (`persona/workshop/`, a `Caller` by a key, SC-34) · the operation's identity (`operation.identity` of a leaf, D91.2)                                      | API client, webhook · idempotency key |
| domanda (di auth, di q-)                            | lookup                                                                                                                                                                       | key-value lookup                      |
| porta (di una cartella, per un pubblico, di q-)     | door (`_door_persona.ts`; to the folders below, `_door_below.ts`)                                                                                                            |                                       |
| ambito (di una cartella, di un tipo, di q-)         | scope (`_scope.ts`, of the folder; `_scope_command.ts`, one per kind of construct)                                                                                           |                                       |
| mappa della vista (di q-)                           | sight (`sight.ts`, `zz.Sight`): what a folder sees of the others                                                                                                             |                                       |
| vincolo di perimetro · vincolo di limite            | perimeter constraint · limit constraint                                                                                                                                      | 404 instead of 403 · 403 with reason  |
| visitatore                                          | visitor                                                                                                                                                                      | anonymous session                     |
| interfaccia · contratto                             | interface · contract                                                                                                                                                         | inbound adapter                       |
| dati sulla richiesta · pila · frame                 | request data · frame stack · frame                                                                                                                                           |                                       |
| dominio utente · attività · concetto utente         | user domain · activity · user concept                                                                                                                                        |                                       |
| adapter di trasporto                                | transport adapter                                                                                                                                                            |                                       |
| configuratore · verifica di composizione            | configurator · composition check                                                                                                                                             | composition root                      |
| libreria · nucleo · innesco                         | library · nucleus · trigger                                                                                                                                                  |                                       |
| interprete di riferimento                           | reference interpreter (in q-, the oracle: V10)                                                                                                                               |                                       |
| suite di conformità · oracolo                       | conformance suite · oracle                                                                                                                                                   | TCK · test oracle                     |
| capacità (di un adapter) · capacità obbligatorie    | capability · mandatory capabilities                                                                                                                                          |                                       |
| attore                                              | actor                                                                                                                                                                        |                                       |
| traccia                                             | trace (`zz.Trace`, `zz.Traced`: a request a tree answered with no fact, with why, for the user of the node; F6, PER-14)                                                      |                                       |
| dead-letter                                         | dead letter                                                                                                                                                                  |                                       |
| fatto fermo · fatto in attesa dietro                | a dead letter holds its resources · waiting part (SC-42)                                                                                                                     | D94.7, D67.3                          |
| voce ferma · voce in attesa dietro                  | an executor's dead letter holds its entry's resources · waiting entry (SC-53)                                                                                                | D108, D67.3                           |
| tollera il riordino (un consumatore)                | an effect whose order is `any`: its dead letters hold nothing (SC-56)                                                                                                        | D67.3                                 |
| ricorrenza                                          | recurrence: a wait whose return queues the next (SC-43)                                                                                                                      | D68.3, D48                            |
| parte interna (di un'istanza)                       | internal part: the line of an order, of its instance's resource; a list loaded element by element is a process over its parts (SC-44)                                        | D94.1                                 |
| transizione su una lista                            | a transition composed on each element of a list (`each`): a list of named instances loaded in one go (SC-54)                                                                 | D113                                  |
| evento di base · posizione                          | base event · position                                                                                                                                                        |                                       |
| attesa (di una foglia) · fine dell'attesa           | a leaf's wait (`follows`, `ends`: its chain followed by correlation, DOM-3) · the wait is over (`the_wait_is_over`); the time that passes (`zz.Elapsed`, the configurator's) | D58.2                                 |
| risorsa (di un fatto) · identità della voce         | resource · identity of an entry (a query's, LIB-9)                                                                                                                           |                                       |
| risorse dichiarate (di un fatto)                    | declared resources: the fields of a fact's payload that carry the instances it changes and its target, in place of every identity (SC-55)                                    | D94.6                                 |
| registro (delle regole dell'interprete)             | registry                                                                                                                                                                     |                                       |
| registro dei percorsi (di q-)                       | path registry (`registry.ts`)                                                                                                                                                |                                       |
| registro per major · verso (di una forma)           | registry by major (`_registry.json`) · direction of a shape: read by the tree, given to its clients, carried by others (DOM-24)                                              | PER-17                                |
| cancello · finestra (di una superficie)             | gate (`version_not_supported`: a version out of the window, before any node) · window (a tree's majors, its folders, and the version it speaks; PER-17)                      | version negotiation                   |
| guasto di composizione                              | composition fault                                                                                                                                                            |                                       |
| foglia montata · cartella montata                   | mounted leaf (D78.6) · mounted folder (`mounted`, of q-: a folder whose point takes the context a node of another tree gives, EXT-11)                                        | D78.6                                 |

Two names that collide in Italian: the paper's _busta_ is the **event envelope**; q-'s _busta_ (what the relay sees) is the **envelope**. The paper's _nucleo_ is the **nucleus**; the _core_ is the pure part of a domain; Cumino's _nucleo_ is the **kernel**. The paper's _frame_ is a frame of the request's stack; q-'s _riquadro_ is the **frame** of an extension point (EXT-16).

The paper's _soggetto_ has two senses: what a query speaks of (D50.1, D64.1), and on whose behalf one acts (D87.1). q- keeps only the first: **subject** is always a query's, a view named by the business, where the paper's is an aggregate (V12). A **candidate** is an instance of the subject that a selection looks at; an **entry** is what the query returns of a candidate it keeps (its fields). Both are q-'s words, not the paper's.

## Personas of q-

| Italian                                             | English                                    |
| --------------------------------------------------- | ------------------------------------------ |
| io · volto conosciuto · volto sconosciuto · anonimo | `self` · `known` · `unknown` · `anonymous` |
