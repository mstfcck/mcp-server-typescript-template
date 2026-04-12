import type { ToolResponse } from "../../types/index.js";
import { jsonResponse } from "../../lib/response.js";

export async function healthCheckToolHandler(): Promise<ToolResponse> {
  return jsonResponse({
    status: "ok",
    timestamp: new Date().toISOString()
  });
}
