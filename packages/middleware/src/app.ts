import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import { autofillRoutes } from "@/routes/autofill";
import { bookmarkRoutes } from "@/routes/bookmarks";
import { categoryRoutes } from "@/routes/categories";
import { customPropertyRoutes } from "@/routes/customProperties";
import { healthRoutes } from "@/routes/health";
import { metadataRoutes } from "@/routes/metadata";
import { tagRoutes } from "@/routes/tags";

/** Build and configure the Fastify application (without starting it). */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  await app.register(cors, {
    origin: true,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "eeSimple Bookmarks API",
        version: "0.1.0",
      },
      tags: [
        {
          name: "bookmarks",
          description: "Bookmark management endpoints",
        },
        {
          name: "tags",
          description: "Tag taxonomy endpoints",
        },
        {
          name: "custom-properties",
          description: "User-defined custom property endpoints",
        },
        {
          name: "categories",
          description: "Category endpoints for grouping custom properties",
        },
        {
          name: "autofill",
          description: "Autofill rules that prefill the bookmark form",
        },
        {
          name: "health",
          description: "Service health",
        },
        {
          name: "metadata",
          description: "URL metadata helpers (page-title lookup)",
        },
      ],
    },
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  await app.register(healthRoutes);
  await app.register(metadataRoutes);
  await app.register(bookmarkRoutes);
  await app.register(tagRoutes);
  await app.register(customPropertyRoutes);
  await app.register(categoryRoutes);
  await app.register(autofillRoutes);

  return app;
}
