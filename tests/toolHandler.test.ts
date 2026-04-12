import { describe, expect, it } from "vitest";
import { withToolErrorHandling } from "../src/lib/toolHandler.js";

describe("withToolErrorHandling", () => {
  it("passes through successful responses", async () => {
    const handler = withToolErrorHandling(async () => ({
      content: [{ type: "text", text: "ok" }]
    }));

    await expect(handler(undefined, undefined)).resolves.toEqual({
      content: [{ type: "text", text: "ok" }]
    });
  });

  it("converts thrown errors into MCP tool errors", async () => {
    const handler = withToolErrorHandling(async () => {
      throw new Error("invalid input");
    });

    await expect(handler(undefined, undefined)).resolves.toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: "invalid input" }, null, 2)
        }
      ],
      structuredContent: { error: "invalid input" },
      isError: true
    });
  });
});
