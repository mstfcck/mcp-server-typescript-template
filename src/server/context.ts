import { randomUUID } from "node:crypto";
import type { AppTransport, RequestContext } from "../types/index.js";

export function createRequestContext(transport: AppTransport): RequestContext {
  return {
    requestId: randomUUID(),
    transport
  };
}
