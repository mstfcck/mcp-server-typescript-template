import { z } from "zod";
import type { ToolResponse } from "../../types/index.js";
import { jsonResponse } from "../../lib/response.js";

const schema = z.object({
  text: z.string().min(1)
});

export async function echoToolHandler(input: unknown): Promise<ToolResponse> {
  const { text } = schema.parse(input);
  return jsonResponse({ text });
}
