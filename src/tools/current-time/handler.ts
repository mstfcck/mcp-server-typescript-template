import type { ToolResponse } from "../../types/index.js";
import { jsonResponse } from "../../lib/response.js";

export async function currentTimeToolHandler(): Promise<ToolResponse> {
  return jsonResponse({
    now: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}
