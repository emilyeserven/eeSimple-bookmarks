import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import { appSettingsRoutes } from "@/routes/appSettings";
import { autofillRoutes } from "@/routes/autofill";
import { bookmarkRoutes } from "@/routes/bookmarks";
import { categoryRoutes } from "@/routes/categories";
import { cardDisplayRulesRoutes } from "@/routes/cardDisplayRules";
import { conditionNodeSchema, conditionTreeSchema } from "@/routes/conditionSchema";
import { customPropertyRoutes } from "@/routes/customProperties";
import { galleryRoutes } from "@/routes/gallery";
import { healthRoutes } from "@/routes/health";
import { homepageSectionsRoutes } from "@/routes/homepageSections";
import { importRoutes } from "@/routes/imports";
import { customAspectRatioRoutes } from "@/routes/customAspectRatios";
import { pinnedSidebarItemRoutes } from "@/routes/pinnedSidebarItems";
import { favoriteSettingsPageRoutes } from "@/routes/favoriteSettingsPages";
import { savedFilterRoutes } from "@/routes/savedFilters";
import { maintenanceRoutes } from "@/routes/maintenance";
import { mediaTypeRoutes } from "@/routes/mediaTypes";
import { metadataRoutes } from "@/routes/metadata";
import { newsletterRoutes } from "@/routes/newsletters";
import { propertyGroupRoutes } from "@/routes/propertyGroups";
import { relationshipTypeRoutes } from "@/routes/relationshipTypes";
import { tagRoutes } from "@/routes/tags";
import { websiteRoutes } from "@/routes/websites";
import { youtubeChannelRoutes } from "@/routes/youtubeChannels";

/**
 * Whether to register the Swagger/OpenAPI docs (`/docs`).
 *
 * `DOCS_ENABLED` overrides explicitly (`true`/`1` on, `false`/`0` off); when unset it defaults to
 * **on outside production and off in production**. The production gateway runs the middleware with
 * `NODE_ENV=production`, so the docs stay off on a Coolify deploy unless `DOCS_ENABLED=true` is set.
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

  const enableDocs = docsEnabled();
  if (enableDocs) {
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
            name: "homepage-sections",
            description: "Named, ordered homepage sections with their own condition filters",
          },
          {
            name: "saved-filters",
            description: "Named filter presets that can be applied to any bookmark listing",
          },
          {
            name: "pinned-sidebar-items",
            description: "Entities and saved filters pinned as quick-access links in the sidebar",
          },
          {
            name: "display-presets",
            description: "Named display presets (columns, image settings) that can be applied to any listing page",
          },
          {
            name: "app-settings",
            description: "Global application settings (e.g. the URL-shortener ignore list)",
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
          {
            name: "gallery",
            description: "Storage bucket manifest, scan/reconcile, and orphan cleanup",
          },
          {
            name: "newsletters",
            description: "Newsletters publication taxonomy: CRUD and a newsletter's issues",
          },
          {
            name: "imports",
            description: "Imports: ingest links into the Inbox review queue, approve/reject/block, purge",
          },
        ],
      },
    });
    await app.register(swaggerUi, {
      routePrefix: "/docs",
    });
  }

  // Shared recursive condition-tree schema, referenced by autofill + homepage-filter bodies.
  app.addSchema(conditionNodeSchema);
  app.addSchema(conditionTreeSchema);

  await app.register(healthRoutes);
  await app.register(metadataRoutes);
  await app.register(newsletterRoutes);
  await app.register(importRoutes);
  await app.register(bookmarkRoutes);
  await app.register(tagRoutes);
  await app.register(websiteRoutes);
  await app.register(mediaTypeRoutes);
  await app.register(youtubeChannelRoutes);
  await app.register(customPropertyRoutes);
  await app.register(propertyGroupRoutes);
  await app.register(relationshipTypeRoutes);
  await app.register(categoryRoutes);
  await app.register(autofillRoutes);
  await app.register(homepageSectionsRoutes);
  await app.register(cardDisplayRulesRoutes);
  await app.register(savedFilterRoutes);
  await app.register(pinnedSidebarItemRoutes);
  await app.register(favoriteSettingsPageRoutes);
  await app.register(customAspectRatioRoutes);
  await app.register(appSettingsRoutes);
  await app.register(maintenanceRoutes);
  await app.register(galleryRoutes);

  return app;
}
