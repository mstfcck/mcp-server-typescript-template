export function safeJsonStringify(value: unknown, pretty = true): string {
  return JSON.stringify(value, null, pretty ? 2 : 0);
}
