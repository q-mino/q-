// The chat's look (K-3, WEB-26; part M5): its own `<style>`, in the layer
// of the extensions, scoped by its class, with the design's variables, so
// that it follows the theme (Roano, Lavagna) and the kernel's mark stays
// over it (the layer `frame`). In its place a line; on the whole screen a
// conversation as a phone's messaging app draws one: the newest at the
// bottom against the field, hers at the end in the extension's hue, theirs
// at the start on paper, the field at the bottom above the keyboard (the
// page resizes with it, `interactive-widget=resizes-content`). Each case by
// its `data-*`, never a class chosen in code (CLAUDE.md, Preact).
// Every text pair is AA in both themes (at least 5.2:1). [Q, C, 27 Nov 2026]

export const its_look = `@layer extensions {
  .the-chat { margin: 0; color: var(--ink); }
  .the-chat [data-part='for-a-screen-reader'] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .the-chat [data-part='glyph'] { inline-size: 1em; block-size: 1em; flex: none; }

  /* In its place: the last message in a line, and how many to read or where hers stands. */
  /* The words first, at least a few of them; where they and the side do not fit, the side goes below, at the end. */
  .the-chat[data-where='in_its_place'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-2);
    min-block-size: 1.75rem;
    line-height: var(--line-tight);
  }
  .the-chat[data-where='in_its_place'] > [data-part='last'] {
    flex: 1 1 9rem;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .the-chat[data-where='in_its_place'][data-state='none'] > [data-part='last'],
  .the-chat[data-where='in_its_place'][data-state='not_read'] > [data-part='last'] { color: var(--ink-soft); }
  .the-chat[data-where='in_its_place'][data-to-read='some'] > [data-part='last'] { font-weight: var(--weight-strong); }
  .the-chat [data-part='who'] { color: var(--ink-soft); font-weight: normal; }
  .the-chat[data-where='in_its_place'] > [data-part='side'] {
    display: inline-flex;
    flex: none;
    margin-inline-start: auto;
    align-items: center;
    gap: var(--space-2);
    color: var(--ink-soft);
    font-size: var(--text-s);
  }
  .the-chat [data-part='stage'] { display: inline-flex; align-items: center; gap: var(--space-1); }
  /* What went wrong in the fault's colour; what she did herself (called off, put aside) stays quiet. */
  .the-chat [data-part='stage']:is([data-state='no_receipt'], [data-state='could_not_be_delivered'], [data-state='held']) {
    color: var(--fault);
  }
  .the-chat [data-part='to-read'] {
    padding: 0 var(--space-2);
    border-radius: var(--radius-round);
    background: var(--extension-ink);
    color: var(--extension-paper);
    font-weight: var(--weight-strong);
    line-height: 1.5rem;
  }

  /* On the whole screen: the messages, then the field. */
  .the-chat[data-where='on_the_whole_screen'] {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    block-size: 100%;
    min-block-size: 0;
  }
  /* The messages hug the field and stay there as new ones come (a reversed column, its one child the whole). */
  .the-chat [data-part='messages'] {
    display: flex;
    flex-direction: column-reverse;
    min-block-size: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-block: var(--space-2);
  }
  .the-chat [data-part='all'] { display: grid; gap: var(--space-2); }
  .the-chat [data-part='all'] > ol { display: grid; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
  .the-chat [data-part='all'] > p { margin: var(--space-4) 0; color: var(--ink-soft); text-align: center; }
  .the-chat [data-part='older'],
  .the-chat [data-part='read-again'],
  .the-chat [data-part='send-again'] {
    justify-self: center;
    min-block-size: 2.5rem;
    padding: 0 var(--space-4);
    border: 2px solid var(--extension-edge);
    border-radius: var(--radius-round);
    background: var(--paper-raised);
    color: var(--extension-ink);
    font-weight: var(--weight-strong);
  }
  /* «Invia di nuovo» under her message: a gesture of its own, quieter than the message. */
  .the-chat [data-part='send-again'] {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    justify-self: end;
    min-block-size: 2.25rem;
    padding: 0 var(--space-3);
    border-width: 1px;
    font-size: var(--text-s);
  }

  .the-chat [data-part='a-message'] { display: grid; justify-items: start; gap: var(--space-1); }
  .the-chat [data-part='a-message'][data-whose='mine'] { justify-items: end; }
  .the-chat [data-part='day'] {
    justify-self: center;
    margin-block: var(--space-2) var(--space-1);
    padding: 0 var(--space-3);
    border-radius: var(--radius-round);
    background: var(--paper-sunken);
    color: var(--ink-soft);
    font-size: var(--text-s);
    line-height: 1.75rem;
  }
  .the-chat [data-part='bubble'] {
    display: grid;
    gap: var(--space-1);
    max-inline-size: min(85%, 34rem);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--roan-line);
    border-radius: var(--radius-l);
    border-end-start-radius: var(--radius-s);
    background: var(--paper-raised);
    box-shadow: var(--shadow-raised);
    cursor: pointer;
  }
  .the-chat [data-whose='mine'] > [data-part='bubble'] {
    border-color: var(--extension-edge);
    border-end-start-radius: var(--radius-l);
    border-end-end-radius: var(--radius-s);
    background: var(--extension-raised);
  }
  .the-chat [data-part='text'] { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
  .the-chat [data-part='meta'] {
    display: inline-flex;
    align-items: center;
    justify-self: end;
    gap: var(--space-2);
    min-block-size: 1.5rem;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-soft);
    font-size: var(--text-s);
    cursor: pointer;
  }
  .the-chat [data-part='annotations'] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-1) var(--space-3);
    margin: var(--space-1) 0 0;
    padding-block-start: var(--space-2);
    border-block-start: 1px solid var(--roan-line);
    font-size: var(--text-s);
    cursor: auto;
  }
  .the-chat [data-part='annotations'] dt { color: var(--ink-soft); }
  .the-chat [data-part='annotations'] dd { margin: 0; }

  /* The field at the bottom, and «Invia». */
  .the-chat [data-part='field'] {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--space-2);
    padding-block-start: var(--space-2);
    border-block-start: 1px solid var(--roan-line);
  }
  .the-chat [data-part='field'] > [data-part='note'] {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--ink-soft);
    font-size: var(--text-s);
  }
  .the-chat [data-part='field'] > [data-part='note'][data-state='not_written'] { color: var(--fault); }
  /* The polite region of how a message went, kept in place while it has nothing to tell, without a row. */
  .the-chat [data-part='field'] > [data-part='note']:empty { position: absolute; }
  .the-chat [data-part='field'] label { display: grid; }
  .the-chat [data-part='field'] textarea {
    field-sizing: content;
    min-block-size: var(--tap);
    max-block-size: 9rem;
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--roan-edge);
    border-radius: 1.5rem;
    background: var(--paper-raised);
    color: var(--ink);
    line-height: var(--line);
    resize: none;
  }
  .the-chat [data-part='send'] {
    display: grid;
    place-items: center;
    inline-size: var(--tap);
    block-size: var(--tap);
    padding: 0;
    border: 0;
    border-radius: var(--radius-round);
    background: var(--extension-ink);
    color: var(--extension-paper);
    font-size: 1.25rem;
  }
  .the-chat [data-part='send']:disabled { opacity: 0.45; }
}`
