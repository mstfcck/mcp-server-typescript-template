import { z } from "zod";

export const echoToolDefinition = {
  name: "echo",
  title: "Echo Text",
  description: "Echoes back validated text and returns a structured payload.",
  inputSchema: {
    text: z.string().min(1).describe("Text to echo back.")
  },
  outputSchema: {
    text: z.string().describe("The echoed text.")
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
} as const;
