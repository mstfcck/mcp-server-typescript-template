import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type AppEnvironment = "development" | "test" | "production";
export type AppTransport = "stdio" | "streamable-http";

export interface AppConfig {
  nodeEnv: AppEnvironment;
  logLevel: string;
  serverName: string;
  serverVersion: string;
  transport: AppTransport;
  host: string;
  port: number;
  allowedHosts: string[];
  trustProxyHops: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  shutdownGraceMs: number;
}

export interface RequestContext {
  requestId: string;
  transport: AppTransport;
}

export type ToolResponse = CallToolResult;
