import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { examplePrompts } from "../prompts/index.js";
import { staticResources, templateResources } from "../resources/index.js";
import { toolRegistry } from "../tools/index.js";

export function registerServerFeatures(server: McpServer): void {
  for (const tool of toolRegistry) {
    tool.register(server);
  }

  for (const resource of staticResources) {
    resource.register(server);
  }

  for (const resource of templateResources) {
    resource.register(server);
  }

  for (const prompt of examplePrompts) {
    prompt.register(server);
  }
}
