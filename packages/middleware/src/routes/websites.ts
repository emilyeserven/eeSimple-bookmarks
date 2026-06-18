import type { FastifyInstance } from "fastify";
import type { CreateWebsiteInput, UpdateWebsiteInput, WebsiteLookup } from "@eesimple/types";
import {
  BuiltInWebsiteError,
  createWebsite,
  deleteWebsite,
  DuplicateDomainError,
  InvalidDomainError,
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

const shortenedLinksSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["domain", "expandTo", "keepShortened"],
    additionalProperties: false,
    properties: {
      domain: {
        type: "string",
        minLength: 1,
      },
      expandTo: {
        type: ["string", "null"],
      },
      keepShortened: {
        type: "boolean",
      },
    },
  },
} as const;

const paramRulesSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["pathSuffix", "params"],
    additionalProperties: false,
    properties: {
      pathSuffix: {
        type: "string",
      },
      params: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  },
} as const;

const createWebsiteBody = {
  type: "object",
  required: ["domain"],
  additionalProperties: false,
  properties: {
    domain: {
      type: "string",
      minLength: 1,
    },
    siteName: {
      type: "string",
      minLength: 1,
    },
    shortenedLinks: shortenedLinksSchema,
    paramRules: paramRulesSchema,
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
    shortenedLinks: shortenedLinksSchema,
    paramRules: paramRulesSchema,
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
      domain, website, shortener,
    } = await lookupWebsiteByUrl(url);
    const result: WebsiteLookup = {
      domain,
      exists: website !== null,
      siteName: website?.siteName ?? null,
      shortener,
    };
    return result;
  });

  app.post("/api/websites", {
    schema: {
      tags: ["websites"],
      body: createWebsiteBody,
    },
  }, async (req, reply) => {
    try {
      const website = await createWebsite(req.body as CreateWebsiteInput);
      return reply.code(201).send(website);
    }
    catch (err) {
      if (err instanceof DuplicateDomainError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      if (err instanceof InvalidDomainError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      throw err;
    }
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
      if (err instanceof BuiltInWebsiteError) {
        return reply.code(403).send({
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
    try {
      const deleted = await deleteWebsite(id);
      if (!deleted) return reply.code(404).send({
        message: "Website not found",
      });
      return reply.code(204).send();
    }
    catch (err) {
      if (err instanceof BuiltInWebsiteError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });
}
