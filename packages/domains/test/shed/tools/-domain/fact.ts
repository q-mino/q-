import z from 'zod';
import { tool_id, tool_name, category, notes, tool_status } from './value';


export const a_tool_has_been_added = z
  .strictObject({
    version: z.literal(1),
    id: tool_id,
    name: tool_name,
    category: category,
    notes: notes.optional(),
    status: tool_status,
  })
  .brand(Symbol('fact: a tool has been added'));
