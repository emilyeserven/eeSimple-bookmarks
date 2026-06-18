import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import { autofillRoutes } from "@/routes/autofill";
import { bookmarkRoutes } from "@/routes/bookmarks";
import { categoryRoutes } from "@/routes/categories";
import { conditionNodeSchema, conditionTreeSchema } from "@/routes/conditionSchema";
import { customPropertyRoutes } from "@/routes/customProperties";
import { healthRoutes } from "@/routes/health";
import { homepageFilterRoutes } from "@/routes/homepageFilter";
import { homepageSectionsRoutes } from "@/routes/homepageSections";
import { mediaTypeRoutes } from "@/routes/mediaTypes";
import { metadataRoutes } from "@/routes/metadata";
import { tagRoutes } from "@/routes/tags";
import { websiteRoutes } from "@/routes/websites";
import { youtubeChannelRoutes } from "@/routes/youtubeChannels";

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

  // Bookmark image uploads. Cap the raw upload so a huge file can't exhaust memory; `sharp`
  // shrinks whatever lands to an 800px WebP afterwards.
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: {
      fileSize: 8 * 1024 * 1024,
      files: 1,
    },
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
          name: "websites",
          description: "Built-in Websites taxonomy endpoints",
        },
        {
          name: "media-types",
          description: "Built-in Media Types taxonomy endpoints",
        },
        {
          name: "youtube-channels",
          description: "Built-in YouTube Channels taxonomy endpoints",
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
          name: "homepage",
          description: "The condition filter that selects homepage bookmarks",
        },
        {
          name: "homepage-sections",
          description: "Named, ordered homepage sections with their own condition filters",
        },
        {
          name: "health",
          description: "Service health",
        },
        {
          name: "metadata",
          description: "URL metadata helpers (page-title lookup)",
        },
        {
          name: "images",
          description: "Bookmark image upload, auto-capture, and serving",
        },
      ],
    },
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  // Shared recursive condition-tree schema, referenced by autofill + homepage-filter bodies.
  app.addSchema(conditionNodeSchema);
  app.addSchema(conditionTreeSchema);

  await app.register(healthRoutes);
  await app.register(metadataRoutes);
  await app.register(bookmarkRoutes);
  await app.register(tagRoutes);
  await app.register(websiteRoutes);
  await app.register(mediaTypeRoutes);
  await app.register(youtubeChannelRoutes);
  await app.register(customPropertyRoutes);
  await app.register(categoryRoutes);
  await app.register(autofillRoutes);
  await app.register(homepageFilterRoutes);
  await app.register(homepageSectionsRoutes);

  return app;
}
