import type { Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import rateLimit from "express-rate-limit";
import type { Express, Request, Response } from "express";
import helmet from "helmet";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { createServer } from "../createServer.js";

const MCP_ENDPOINT = "/mcp";
const HEALTH_ENDPOINT = "/healthz";

function sendJsonRpcError(
  response: Response,
  statusCode: number,
  message: string,
  code = -32000
): void {
  response.status(statusCode).json({
    jsonrpc: "2.0",
    error: {
      code,
      message
    },
    id: null
  });
}

async function handlePostRequest(
  request: Request,
  response: Response
): Promise<void> {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  } as unknown as ConstructorParameters<
    typeof StreamableHTTPServerTransport
  >[0]);

  const cleanup = async (): Promise<void> => {
    await Promise.allSettled([transport.close(), server.close()]);
  };

  response.on("close", () => {
    void cleanup();
  });

  try {
    await server.connect(transport as Parameters<typeof server.connect>[0]);
    await transport.handleRequest(request, response, request.body);
  } catch (error: unknown) {
    logger.error({ error }, "Failed to handle MCP Streamable HTTP request");

    if (!response.headersSent) {
      sendJsonRpcError(response, 500, "Internal server error", -32603);
    }
  }
}

export function createStreamableHttpApp(): Express {
  const app = createMcpExpressApp(
    env.allowedHosts.length > 0
      ? {
          host: env.host,
          allowedHosts: env.allowedHosts
        }
      : {
          host: env.host
        }
  );

  app.disable("x-powered-by");

  if (env.trustProxyHops > 0) {
    app.set("trust proxy", env.trustProxyHops);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (request) => request.path === HEALTH_ENDPOINT
    })
  );

  app.get(HEALTH_ENDPOINT, (_request: Request, response: Response) => {
    response.status(200).json({
      status: "ok",
      transport: "streamable-http",
      name: env.serverName,
      version: env.serverVersion
    });
  });

  app.post(MCP_ENDPOINT, async (request: Request, response: Response) => {
    await handlePostRequest(request, response);
  });

  app.get(MCP_ENDPOINT, (_request: Request, response: Response) => {
    sendJsonRpcError(response, 405, "Method not allowed.");
  });

  app.delete(MCP_ENDPOINT, (_request: Request, response: Response) => {
    sendJsonRpcError(response, 405, "Method not allowed.");
  });

  return app;
}

function registerShutdownHandlers(server: HttpServer): void {
  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ signal }, "Shutting down Streamable HTTP server");

    const forceCloseTimer = setTimeout(() => {
      logger.error({ signal }, "HTTP server shutdown exceeded grace period");
      server.closeAllConnections?.();
      process.exit(1);
    }, env.shutdownGraceMs);

    forceCloseTimer.unref();

    server.close((error?: Error) => {
      clearTimeout(forceCloseTimer);

      if (error) {
        logger.error({ error, signal }, "Failed to close HTTP server cleanly");
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

export async function startStreamableHttpServer(): Promise<void> {
  const app = createStreamableHttpApp();

  const server = await new Promise<HttpServer>((resolve, reject) => {
    const httpServer = app.listen(env.port, env.host, () =>
      resolve(httpServer)
    );
    httpServer.once("error", reject);
  });

  registerShutdownHandlers(server);

  server.requestTimeout = 30_000;
  server.headersTimeout = 31_000;
  server.keepAliveTimeout = 5_000;

  const address = server.address() as AddressInfo;

  logger.info(
    {
      host: address.address,
      port: address.port,
      path: MCP_ENDPOINT,
      healthPath: HEALTH_ENDPOINT,
      transport: "streamable-http"
    },
    "Streamable HTTP server listening"
  );
}
