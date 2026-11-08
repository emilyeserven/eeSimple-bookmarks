import type { FastifyInstance } from "fastify";

import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { fileRoutes } from "@/routes/files";
import { healthRoutes } from "@/routes/health";
import { itemRoutes } from "@/routes/items";
import { errorHandler } from "@/utils/errorHandler";

/**
 * Whether to register the Swagger/OpenAPI docs (`/docs`).
 *
 * `DOCS_ENABLED` overrides explicitly (`true`/`1` on, `false`/`0` off); when unset it defaults to
 * **on outside production and off in production**. The production gateway runs the middleware with
 * `NODE_ENV=production`, so the docs stay off on a deploy unless `DOCS_ENABLED=true` is set.
 * The gateway parses the same flag the same way to decide whether to proxy `/docs` — keep the two in
 * sync (see `packages/gateway/server.js`).
 */
export function docsEnabled(): boolean {
  const flag = process.env.DOCS_ENABLED;
  if (flag === undefined || flag === "") return process.env.NODE_ENV !== "production";
  return flag === "true" || flag === "1";
}

/** Build and configure the Fastify application (without starting it). */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      ...(process.env.NODE_ENV !== "production" && {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
    },
  });

  // Single error envelope for the whole API. Routes `throw` an `AppError` (or let a Fastify
  // schema-validation error bubble); the handler serializes it to `{ message, code, statusCode,
  // params? }` so the client can translate `code` and fall back to the English `message`.
  app.setErrorHandler(errorHandler);

  await app.register(cors, {
    origin: true,
  });

  // File uploads. Cap the raw upload so a huge file can't exhaust memory on a small host.
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: {
      fileSize: Number(process.env.UPLOAD_MAX_BYTES ?? 8 * 1024 * 1024),
      files: 1,
    },
  });

  if (docsEnabled()) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: "App API",
          version: "0.1.0",
        },
        tags: [
          {
            name: "health",
            description: "Service health",
          },
          {
            name: "items",
            description: "Example CRUD entity",
          },
          {
            name: "files",
            description: "File upload/serving via the S3-compatible object store",
          },
        ],
      },
    });
    await app.register(swaggerUi, {
      routePrefix: "/docs",
    });
  }

  // Log params / query / body at debug level so `LOG_LEVEL=debug` surfaces request detail
  // without polluting the default info output.
  app.addHook("preHandler", (req, _reply, done) => {
    req.log.debug(
      {
        params: req.params,
        query: req.query,
        ...(req.body !== undefined && {
          body: req.body,
        }),
      },
      "route detail",
    );
    done();
  });

  await app.register(healthRoutes);
  await app.register(itemRoutes);
  await app.register(fileRoutes);

  return app;
}
