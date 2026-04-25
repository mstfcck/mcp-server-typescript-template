import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema
} from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let client: Client | undefined;
let transport: StdioClientTransport | undefined;
let stderrOutput = "";

afterEach(async () => {
  if (transport) {
    await transport.close();
    transport = undefined;
  }

  client = undefined;
  stderrOutput = "";
});

describe("stdio transport", () => {
  it("lists tools and executes a tool over stdio", async () => {
    client = new Client({
      name: "template-stdio-test-client",
      version: "1.0.0"
    });

    transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", "src/index.ts"],
      cwd: repoRoot,
      env: {
        ...process.env,
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        MCP_TRANSPORT: "stdio"
      },
      stderr: "pipe"
    });

    transport.stderr?.on("data", (chunk: Buffer | string) => {
      stderrOutput += chunk.toString();
    });

    try {
      await client.connect(transport);

      const tools = await client.request(
        {
          method: "tools/list",
          params: {}
        },
        ListToolsResultSchema
      );

      expect(tools.tools.some((tool) => tool.name === "echo")).toBe(true);

      const result = await client.request(
        {
          method: "tools/call",
          params: {
            name: "echo",
            arguments: {
              text: "hello over stdio"
            }
          }
        },
        CallToolResultSchema
      );

      expect(result.structuredContent).toEqual({ text: "hello over stdio" });
      expect(result.isError).not.toBe(true);
    } catch (error: unknown) {
      const detail = stderrOutput.trim();

      throw new Error(
        detail
          ? `Stdio smoke test failed with server stderr:\n${detail}`
          : "Stdio smoke test failed.",
        { cause: error }
      );
    }
  });
});
