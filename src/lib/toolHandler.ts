import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "../config/logger.js";
import type { ToolInputSchema } from "../server/registrationTypes.js";
import type { ToolResponse } from "../types/index.js";
import { toErrorMessage } from "./errors.js";
import { errorResponse } from "./response.js";

export type ToolHandler<
  TInputSchema extends ToolInputSchema = ToolInputSchema
> = ToolCallback<TInputSchema>;

export function withToolErrorHandling<
  TInputSchema extends ToolInputSchema = ToolInputSchema
>(handler: ToolHandler<TInputSchema>): ToolHandler<TInputSchema> {
  const invoke = handler as (
    ...args: Parameters<ToolHandler<TInputSchema>>
  ) => Promise<ToolResponse> | ToolResponse;

  return (async (
    ...args: Parameters<ToolHandler<TInputSchema>>
  ): Promise<ToolResponse> => {
    try {
      return await invoke(...args);
    } catch (error: unknown) {
      logger.warn({ error }, "Tool handler failed");
      return errorResponse(toErrorMessage(error));
    }
  }) as ToolHandler<TInputSchema>;
}
