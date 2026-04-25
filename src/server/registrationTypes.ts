import type {
  McpServer,
  ResourceTemplate,
  ToolCallback
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type {
  AnySchema,
  ZodRawShapeCompat
} from "@modelcontextprotocol/sdk/server/zod-compat.js";

type PromptArgsSchema = NonNullable<
  Parameters<McpServer["registerPrompt"]>[1]["argsSchema"]
>;

type PromptMessages = Awaited<
  ReturnType<Parameters<McpServer["registerPrompt"]>[2]>
>["messages"];

export type ToolInputSchema = undefined | ZodRawShapeCompat | AnySchema;
export type ToolOutputSchema = undefined | ZodRawShapeCompat | AnySchema;

export type ToolRegistrationDefinition<
  InputSchema extends ToolInputSchema = ToolInputSchema,
  OutputSchema extends ToolOutputSchema = ToolOutputSchema
> = {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: InputSchema;
  outputSchema?: OutputSchema;
  annotations?: ToolAnnotations;
  _meta?: Record<string, unknown>;
};

export type ToolRegistration<
  InputSchema extends ToolInputSchema = ToolInputSchema,
  OutputSchema extends ToolOutputSchema = ToolOutputSchema
> = {
  definition: ToolRegistrationDefinition<InputSchema, OutputSchema>;
  handler: ToolCallback<InputSchema>;
};

export function defineToolRegistration<
  InputSchema extends ToolInputSchema,
  OutputSchema extends ToolOutputSchema
>(
  registration: ToolRegistration<InputSchema, OutputSchema>
): ToolRegistration<InputSchema, OutputSchema> {
  return registration;
}

export type StaticResourceRegistration = {
  name: string;
  uri: string;
  title: string;
  description: string;
  mimeType: string;
  text: string;
};

export type TemplateResourceRegistration = {
  name: string;
  template: ResourceTemplate;
  title: string;
  description: string;
  mimeType: string;
  read: (
    uri: URL,
    variables: Record<string, string | string[]>
  ) => {
    contents: Array<{ uri: string; mimeType: string; text: string }>;
  };
};

export type PromptRegistration = {
  name: string;
  title: string;
  description: string;
  argsSchema: PromptArgsSchema;
  messages: (arguments_: unknown) => PromptMessages;
};
