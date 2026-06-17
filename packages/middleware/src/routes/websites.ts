import type { FastifyInstance } from "fastify";
import type { UpdateWebsiteInput, WebsiteLookup } from "@eesimple/types";
import {
  deleteWebsite,
  DuplicateDomainError,
  listWebsites,
  lookupWebsiteByUrl,
  updateWebsite,
} from "@/services/websites";

const websiteParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const lookupQuery = {
  type: "object",
  required: ["url"],
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

const updateWebsiteBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    siteName: {
      type: "string",
      minLength: 1,
    },
    domain: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

/** Routes for the built-in Websites taxonomy, mounted under `/api/websites`. */
export async function websiteRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/websites", {
    schema: {
      tags: ["websites"],
    },
  }, async () => listWebsites());

  app.get("/api/websites/lookup", {
    schema: {
      tags: ["websites"],
      querystring: lookupQuery,
    },
  }, async (req) => {
    const {
      url,
    } = req.query as { url: string };
    const {
      domain, website,
    } = await lookupWebsiteByUrl(url);
    const result: WebsiteLookup = {
      domain,
      exists: website !== null,
      siteName: website?.siteName ?? null,
    };
    return result;
  });

  app.patch("/api/websites/:id", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
      body: updateWebsiteBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const website = await updateWebsite(id, req.body as UpdateWebsiteInput);
      if (!website) return reply.code(404).send({
        message: "Website not found",
      });
      return website;
    }
    catch (err) {
      if (err instanceof DuplicateDomainError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/websites/:id", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteWebsite(id);
    if (!deleted) return reply.code(404).send({
      message: "Website not found",
    });
    return reply.code(204).send();
  });
}
