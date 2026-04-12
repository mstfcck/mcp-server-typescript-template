import type { ToolResponse } from "../../types/index.js";
import { env } from "../../config/env.js";
import { jsonResponse } from "../../lib/response.js";

export async function serverInfoToolHandler(): Promise<ToolResponse> {
  return jsonResponse({
    name: env.serverName,
    version: env.serverVersion,
    transport: env.transport,
    environment: env.nodeEnv
  });
}
