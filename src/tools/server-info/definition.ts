import { z } from "zod";

export const serverInfoToolDefinition = {
  name: "server_info",
  title: "Server Info",
  description: "Returns MCP server metadata that is useful during debugging.",
  inputSchema: {},
  outputSchema: {
    name: z.string(),
    version: z.string(),
    transport: z.string(),
    environment: z.string()
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
} as const;
