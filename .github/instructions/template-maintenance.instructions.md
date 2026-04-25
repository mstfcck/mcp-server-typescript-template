---
description: "Use when maintaining, modifying, or extending the root MCP server template itself — editing shared src/, scripts/, tests/, configs, or any file outside examples/. Covers template conventions, tool/prompt/resource patterns, validation commands, and changelog practices."
applyTo: "{src,scripts,tests,.github/workflows}/**"
---

# MCP Server TypeScript Template — Maintenance Guide

## Project Role

This repository **is the template**. Changes here must stay generic, reusable, and free of domain logic.
Every file under `src/` is the authoritative source for what an MCP server built from this template should look like.

## Directory Structure

```text
src/
  config/      – env.ts (Zod-validated env), logger.ts (pino)
  lib/         – errors.ts, json.ts, response.ts, toolHandler.ts (shared utilities)
  server/      – createServer.ts, register.ts, registrationTypes.ts, registrationHelpers.ts, transports/
  tools/       – <tool-name>/definition.ts + handler.ts, index.ts (registry)
  prompts/     – examples.ts (built-ins), generated.ts, index.ts
  resources/   – static.ts (built-ins), generated.ts, index.ts
  types/       – index.ts (AppConfig, ToolResponse, etc.)
scripts/       – generate-tool.mjs, generate-prompt.mjs, generate-resource.mjs
tests/         – vitest unit & integration tests
```

## Tool Pattern (mandatory)

Every tool lives in `src/tools/<kebab-name>/` and consists of exactly two files:

### `definition.ts`

```ts
import { z } from "zod";

export const <name>ToolInputSchema  = { /* Zod fields */ } as const;
export const <name>ToolInputValidator  = z.object(<name>ToolInputSchema);

export const <name>ToolOutputSchema = { /* Zod fields */ } as const;
export const <name>ToolOutputValidator = z.object(<name>ToolOutputSchema);

export const <name>ToolDefinition = {
  name: "<kebab-name>",
  title: "Human Title",
  description: "...",
  inputSchema:  <name>ToolInputSchema,
  outputSchema: <name>ToolOutputSchema,
  annotations: {
    readOnlyHint:    true,
    destructiveHint: false,
    idempotentHint:  true,
    openWorldHint:   false   // set true only when calling external services
  }
} as const;
```

### `handler.ts`

```ts
import type { ToolResponse } from "../../types/index.js";
import { jsonResponse } from "../../lib/response.js";
import { <name>ToolInputValidator, <name>ToolOutputValidator } from "./definition.js";

export function <name>ToolHandler(input: unknown): ToolResponse {
  const { ... } = <name>ToolInputValidator.parse(input);
  const output = <name>ToolOutputValidator.parse({ ... });
  return jsonResponse(output);
}
```

- Validate both **input and output** via Zod in every handler.
- Return `jsonResponse()` for structured data; use `errorResponse()` only for explicit domain errors (not thrown exceptions — those are caught by `withToolErrorHandling`).
- Never return raw `text` from a handler that also declares an `outputSchema`.

## Registration

After creating a new tool, add it to `src/tools/index.ts`:

```ts
import { createToolRegistration } from "../server/registrationHelpers.js";

export const toolRegistry = [
  createToolRegistration({
    definition: <name>ToolDefinition,
    handler: <name>ToolHandler
  })
  // ...
] as const;
```

- Tool, prompt, and resource registries are helper-backed and expose a uniform `register(server)` surface.
- `src/server/registrationHelpers.ts` is the shared source for `createToolRegistration`, `createPromptRegistration`, `createStaticResourceRegistration`, and `createTemplateResourceRegistration`.
- `src/server/register.ts` should stay as a thin loop over the registerable tool, prompt, and resource arrays.

Prefer using the generator script instead of manual registration:

```bash
npm run generate:tool -- <kebab-name>
npm run generate:prompt -- <kebab-name>
npm run generate:resource -- <kebab-name>
```

## Prompts & Resources

- **Built-in** prompts/resources live in `examples.ts` / `static.ts`.
- **Generated** entries go into `generated.ts` (managed by the generator scripts).
- Always re-export via the corresponding `index.ts` that merges both arrays and maps them through the shared registration helpers.
- Prompt `argsSchema` fields must be Zod objects; validate with a dedicated `argsValidator` before use.

## Environment & Config

- All env variables are declared in `src/config/env.ts` using Zod's `envSchema`.
- New variables require: a Zod field in `envSchema`, a mapped field in `AppConfig` (`src/types/index.ts`), and a corresponding entry in `.env.example`.
- Never read `process.env` outside of `env.ts`.

## Validation — run before every commit/PR

```bash
npm run check          # typecheck + lint + lint:md + format:check + test + build
npm run audit:prod     # security audit for production deps only
```

All five gates (typecheck, lint, markdownlint, prettier, vitest) must pass.

## Testing Conventions

- Test files live in `tests/` and mirror the path of the module under test.
- Use `vitest` with `describe` / `it` / `expect`.
- Unit-test handlers directly (pass raw input, assert `ToolResponse`).
- Integration tests for the streamable HTTP transport live in `tests/http.integration.test.ts`.
- The template also maintains a stdio smoke test in `tests/stdio.integration.test.ts` that must keep listing tools and executing a representative tool through the real server entrypoint.
- Do **not** use `any`; prefer `unknown` and narrow with Zod or type guards.

## Template Hygiene Rules

- **No domain-specific code** in `src/` — keep all tools/prompts/resources generic.
- The four built-in tools (`echo`, `health-check`, `server-info`, `current-time`) are _template showcases_; they should remain minimal and self-explanatory.
- `package.json` scripts are part of the template contract — do not remove or rename existing scripts.
- `Dockerfile` must keep the `/healthz` endpoint reachable and `GET /mcp` returning 405.
- Changeset entries (`npm run changeset`) are required for every user-visible change.

## Code Style

- ESM (`import`/`export`), no CommonJS.
- Always use `.js` extension in imports (TypeScript resolves to `.ts`).
- Named exports everywhere; avoid default exports.
- `as const` on all definition objects and registry arrays.
- Prefer `satisfies` / `z.ZodType<…>` for type assertions over casts.
