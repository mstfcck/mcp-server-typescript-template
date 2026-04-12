import { describe, expect, it } from "vitest";
import {
  errorResponse,
  jsonResponse,
  textResponse
} from "../src/lib/response.js";

describe("response helpers", () => {
  it("creates text response", () => {
    expect(textResponse("hello")).toEqual({
      content: [{ type: "text", text: "hello" }]
    });
  });

  it("creates json response", () => {
    expect(jsonResponse({ ok: true })).toEqual({
      content: [{ type: "text", text: JSON.stringify({ ok: true }, null, 2) }],
      structuredContent: { ok: true }
    });
  });

  it("creates error responses with MCP error semantics", () => {
    expect(errorResponse("boom")).toEqual({
      content: [
        { type: "text", text: JSON.stringify({ error: "boom" }, null, 2) }
      ],
      structuredContent: { error: "boom" },
      isError: true
    });
  });
});
