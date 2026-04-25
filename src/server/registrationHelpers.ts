import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withToolErrorHandling } from "../lib/toolHandler.js";
import type {
  PromptRegistration,
  StaticResourceRegistration,
  TemplateResourceRegistration,
  ToolInputSchema,
  ToolOutputSchema,
  ToolRegistration
} from "./registrationTypes.js";

type RegisterableFeature<TFeature> = TFeature & {
  register: (server: McpServer) => void;
};

function createRegisterableFeature<TFeature>(
  feature: TFeature,
  register: (server: McpServer, feature: TFeature) => void
): RegisterableFeature<TFeature> {
  return {
    ...feature,
    register(server: McpServer): void {
      register(server, feature);
    }
  };
}

function createToolConfig<
  TInput extends ToolInputSchema,
  TOutput extends ToolOutputSchema
>(definition: ToolRegistration<TInput, TOutput>["definition"]) {
  return {
    ...(definition.title ? { title: definition.title } : {}),
    ...(definition.description ? { description: definition.description } : {}),
    ...(definition.inputSchema ? { inputSchema: definition.inputSchema } : {}),
    ...(definition.outputSchema
      ? { outputSchema: definition.outputSchema }
      : {}),
    ...(definition.annotations ? { annotations: definition.annotations } : {}),
    ...(definition._meta ? { _meta: definition._meta } : {})
  };
}

export type RegisteredToolFeature<
  TInput extends ToolInputSchema,
  TOutput extends ToolOutputSchema
> = RegisterableFeature<ToolRegistration<TInput, TOutput>>;

export function createToolRegistration<
  TInput extends ToolInputSchema,
  TOutput extends ToolOutputSchema
>(
  tool: ToolRegistration<TInput, TOutput>
): RegisteredToolFeature<TInput, TOutput> {
  return createRegisterableFeature(tool, (server, feature) => {
    server.registerTool(
      feature.definition.name,
      createToolConfig(feature.definition),
      withToolErrorHandling(feature.handler)
    );
  });
}

export type RegisteredPromptFeature = RegisterableFeature<PromptRegistration>;

export function createPromptRegistration(
  prompt: PromptRegistration
): RegisteredPromptFeature {
  return createRegisterableFeature(prompt, (server, feature) => {
    server.registerPrompt(
      feature.name,
      {
        title: feature.title,
        description: feature.description,
        argsSchema: feature.argsSchema
      },
      (arguments_: unknown) => ({
        messages: feature.messages(arguments_)
      })
    );
  });
}

export type RegisteredStaticResourceFeature =
  RegisterableFeature<StaticResourceRegistration>;

export function createStaticResourceRegistration(
  resource: StaticResourceRegistration
): RegisteredStaticResourceFeature {
  return createRegisterableFeature(resource, (server, feature) => {
    server.registerResource(
      feature.name,
      feature.uri,
      {
        title: feature.title,
        description: feature.description,
        mimeType: feature.mimeType
      },
      () => ({
        contents: [
          {
            uri: feature.uri,
            mimeType: feature.mimeType,
            text: feature.text
          }
        ]
      })
    );
  });
}

export type RegisteredTemplateResourceFeature =
  RegisterableFeature<TemplateResourceRegistration>;

export function createTemplateResourceRegistration(
  resource: TemplateResourceRegistration
): RegisteredTemplateResourceFeature {
  return createRegisterableFeature(resource, (server, feature) => {
    server.registerResource(
      feature.name,
      feature.template,
      {
        title: feature.title,
        description: feature.description,
        mimeType: feature.mimeType
      },
      (uri, variables) => feature.read(uri, variables)
    );
  });
}
