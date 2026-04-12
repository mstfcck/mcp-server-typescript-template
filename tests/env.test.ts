import { describe, expect, it } from "vitest";
import { env } from "../src/config/env.js";

describe("env", () => {
  it("should expose config values", () => {
    expect(env.serverName).toBeTruthy();
    expect(env.serverVersion).toBeTruthy();
  });
});
