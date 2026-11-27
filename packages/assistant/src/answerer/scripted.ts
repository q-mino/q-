// The `scripted` answerer (AST-7): answers given by a script, by the turn's
// texts, for the stories and for a run before Alessandro has logged in the
// bot's configuration. Its default script replies that it is a test, and
// gives a note when a message asks to save («salva»). [Q, C, 27 Nov 2026]

import { words } from '../texts/index.ts'
import type { AnAnswer, Answers, ATurnAsked } from './the_answer.ts'

/** A script: a turn's answer, by its texts. */
export type AScript = (turn: ATurnAsked) => AnAnswer | Promise<AnAnswer>

/** Whether a text asks to save (the default script's reading, not Claude's). */
const asks_to_save = (text: string): boolean => /\bsalva|\bannota/i.test(text)

/** The default script: a reply that says it is a test; a note of an idea when asked to save. */
export const the_default_script: AScript = (turn) => {
  const saving = turn.covered.find(asks_to_save)
  return saving === undefined
    ? { answer: 'replied', reply: words.the_scripted_reply(turn.covered.length) }
    : {
        answer: 'replied',
        reply: `${words.the_scripted_reply(turn.covered.length)} L'ho salvata nelle note del progetto, anonima e con parole mie.`,
        note: {
          title: 'Una richiesta di prova',
          kind: 'idea',
          request: 'Una richiesta salvata dalla risposta di prova dell’assistente.',
          context: '',
        },
      }
}

/** The `scripted` answerer over a script (the default one unless given). */
export const scripted =
  (script: AScript = the_default_script): Answers =>
  async (turn) =>
    script(turn)
