import z from 'zod';
import { tool_id, /* tool_name, category, notes, tool_status  */} from './value';


export const a_tool_has_been_added = z
  .strictObject({
    id: tool_id,
    // credi che bisogna metterci tutto?
    // avendo un log eventi linkati si puo' derivare il comando e quindi tutto il resto
    // azzarderei anche di omettere anche il tool id !
    //
    // name: tool_name,
    // category: category,
    // notes: notes.optional(),
    // status: tool_status,
  })
  .brand<'a_tool_has_been_added'>();
