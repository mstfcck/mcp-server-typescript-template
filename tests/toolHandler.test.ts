import { describe, expect, it } from "vitest";
import { withToolErrorHandling } from "../src/lib/toolHandler.js";
import { toErrorMessage } from "../src/lib/errors.js";

type EmptyInputSchema = Record<never, never>;

function createToolExtra<
  THandler extends (...args: never[]) => unknown
>(): Parameters<THandler>[1] {
  return {
    signal: new AbortController().signal,
    requestId: "test-request",
    sendNotification: () => Promise.resolve(undefined),
    sendRequest: () =>
      Promise.reject(new Error("sendRequest should not be used in this test"))
  } as Parameters<THandler>[1];
}

describe("withToolErrorHandling", () => {
  it("passes through successful responses", async () => {
    const handler = withToolErrorHandling<EmptyInputSchema>(() => ({
      content: [{ type: "text" as const, text: "ok" }]
    }));
    const extra = createToolExtra<typeof handler>();

    await expect(handler({}, extra)).resolves.toEqual({
      content: [{ type: "text", text: "ok" }]
    });
  });

  it("converts thrown errors into MCP tool errors", async () => {
    const handler = withToolErrorHandling<EmptyInputSchema>(() => {
      throw new Error("invalid input");
    });
    const extra = createToolExtra<typeof handler>();

    await expect(handler({}, extra)).resolves.toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: "invalid input" })
        }
      ],
      structuredContent: { error: "invalid input" },
      isError: true
    });
  });

  it("formats ZodError issues as clean field messages without raw schema dump", async () => {
    const { z } = await import("zod");

    // Capture a real ZodError via try/catch so we can re-throw it from a
    // function TypeScript sees as always-throwing (return type: never).
    let zodError: unknown;
    try {
      z.object({ name: z.string() }).parse({ name: 123 });
    } catch (err) {
      zodError = err;
    }

    // toErrorMessage must produce a clean "field: message" string
    const msg = toErrorMessage(zodError);
    expect(msg).toContain("name");
    expect(msg).not.toContain('"code"');

    // withToolErrorHandling must surface the same clean message
    const handler = withToolErrorHandling<EmptyInputSchema>(() => {
      throw zodError;
    });
    const extra = createToolExtra<typeof handler>();
    const result = await handler({}, extra);
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      error: expect.stringContaining("name") as string
    });
    expect(JSON.stringify(result.structuredContent)).not.toContain('"code"');
  });
});
