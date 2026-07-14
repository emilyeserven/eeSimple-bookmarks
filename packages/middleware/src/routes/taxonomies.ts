import type { FastifyInstance } from "fastify";
import type {
  CreateTaxonomyInput,
  CreateTaxonomyTermInput,
  UpdateTaxonomyInput,
  UpdateTaxonomyTermInput,
} from "@eesimple/types";
import {
  bulkDeleteTaxonomies,
  createTaxonomy,
  deleteTaxonomy,
  getTaxonomyBySlug,
  listTaxonomies,
  updateTaxonomy,
} from "@/services/taxonomies";
import {
  bulkDeleteTaxonomyTerms,
  createTaxonomyTerm,
  deleteTaxonomyTerm,
  getTaxonomyTermTree,
  listFavoriteTaxonomyTerms,
  listTaxonomyTerms,
  updateTaxonomyTerm,
} from "@/services/taxonomyTerms";
import { demoteTaxonomy, promoteTagToTaxonomy } from "@/services/taxonomyPromotion";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

const idParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const taxonomyIdParams = {
  type: "object",
  required: ["taxonomyId"],
  properties: {
    taxonomyId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const slugParams = {
  type: "object",
  required: ["slug"],
  properties: {
    slug: {
      type: "string",
    },
  },
} as const;

const createTaxonomyBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    slug: {
      type: "string",
    },
    description: {
      type: ["string", "null"],
    },
    hierarchical: {
      type: "boolean",
    },
    singleValue: {
      type: "boolean",
    },
    icon: {
      type: ["string", "null"],
    },
    showInSidebar: {
      type: "boolean",
    },
    customLayout: {
      type: ["boolean", "null"],
    },
    sortOrder: {
      type: "number",
    },
  },
} as const;

const updateTaxonomyBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    slug: {
      type: "string",
    },
    description: {
      type: ["string", "null"],
    },
    hierarchical: {
      type: "boolean",
    },
    singleValue: {
      type: "boolean",
    },
    icon: {
      type: ["string", "null"],
    },
    showInSidebar: {
      type: "boolean",
    },
    hidden: {
      type: ["boolean", "null"],
    },
    customLayout: {
      type: ["boolean", "null"],
    },
    sortOrder: {
      type: "number",
    },
  },
} as const;

const createTermBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
    },
    parentId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
} as const;

const updateTermBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
    },
    parentId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
    isFavorite: {
      type: "boolean",
    },
  },
} as const;

const promoteBody = {
  type: "object",
  required: ["tagId"],
  additionalProperties: false,
  properties: {
    tagId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const demoteBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    parentTagId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
} as const;

/** CRUD for user-configurable taxonomies, their terms, and promote/demote. Mounted under `/api`. */
export async function taxonomyRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/taxonomies", "taxonomies", bulkDeleteTaxonomies);
  registerBulkDelete(app, "/api/taxonomy-terms", "taxonomies", bulkDeleteTaxonomyTerms);

  app.get("/api/taxonomies", {
    schema: {
      tags: ["taxonomies"],
    },
  }, async () => listTaxonomies());

  app.get("/api/taxonomies/by-slug/:slug", {
    schema: {
      tags: ["taxonomies"],
      params: slugParams,
    },
  }, async (req) => {
    const {
      slug,
    } = req.params as { slug: string };
    const taxonomy = await getTaxonomyBySlug(slug);
    if (!taxonomy) throw new NotFoundError("Taxonomy");
    return taxonomy;
  });

  app.post("/api/taxonomies", {
    schema: {
      tags: ["taxonomies"],
      body: createTaxonomyBody,
    },
  }, async (req, reply) => {
    const taxonomy = await createTaxonomy(req.body as CreateTaxonomyInput);
    return reply.code(201).send(taxonomy);
  });

  app.patch("/api/taxonomies/:id", {
    schema: {
      tags: ["taxonomies"],
      params: idParams,
      body: updateTaxonomyBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const taxonomy = await updateTaxonomy(id, req.body as UpdateTaxonomyInput);
    if (!taxonomy) throw new NotFoundError("Taxonomy");
    return taxonomy;
  });

  app.delete("/api/taxonomies/:id", {
    schema: {
      tags: ["taxonomies"],
      params: idParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteTaxonomy(id);
    if (!deleted) throw new NotFoundError("Taxonomy");
    return reply.code(204).send();
  });

  app.post("/api/taxonomies/promote-tag", {
    schema: {
      tags: ["taxonomies"],
      body: promoteBody,
    },
  }, async (req, reply) => {
    const {
      tagId,
    } = req.body as { tagId: string };
    const taxonomy = await promoteTagToTaxonomy(tagId);
    if (!taxonomy) throw new NotFoundError("Tag");
    return reply.code(201).send(taxonomy);
  });

  app.post("/api/taxonomies/:id/demote", {
    schema: {
      tags: ["taxonomies"],
      params: idParams,
      body: demoteBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      parentTagId,
    } = req.body as { parentTagId?: string | null };
    const result = await demoteTaxonomy(id, parentTagId);
    if (!result) throw new NotFoundError("Taxonomy");
    return result;
  });

  // Terms — scoped under a taxonomy for list/tree/create; flat by id for update/delete/bulk.
  app.get("/api/taxonomies/:taxonomyId/terms", {
    schema: {
      tags: ["taxonomies"],
      params: taxonomyIdParams,
    },
  }, async (req) => {
    const {
      taxonomyId,
    } = req.params as { taxonomyId: string };
    return listTaxonomyTerms(taxonomyId);
  });

  app.get("/api/taxonomies/:taxonomyId/terms/tree", {
    schema: {
      tags: ["taxonomies"],
      params: taxonomyIdParams,
    },
  }, async (req) => {
    const {
      taxonomyId,
    } = req.params as { taxonomyId: string };
    return getTaxonomyTermTree(taxonomyId);
  });

  app.post("/api/taxonomies/:taxonomyId/terms", {
    schema: {
      tags: ["taxonomies"],
      params: taxonomyIdParams,
      body: createTermBody,
    },
  }, async (req, reply) => {
    const {
      taxonomyId,
    } = req.params as { taxonomyId: string };
    const term = await createTaxonomyTerm(taxonomyId, req.body as CreateTaxonomyTermInput);
    return reply.code(201).send(term);
  });

  // Literal path — registered before `/api/taxonomy-terms/:id` so it wins over the param route.
  app.get("/api/taxonomy-terms/favorites", {
    schema: {
      tags: ["taxonomies"],
    },
  }, async () => listFavoriteTaxonomyTerms());

  app.patch("/api/taxonomy-terms/:id", {
    schema: {
      tags: ["taxonomies"],
      params: idParams,
      body: updateTermBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const term = await updateTaxonomyTerm(id, req.body as UpdateTaxonomyTermInput);
    if (!term) throw new NotFoundError("Taxonomy term");
    return term;
  });

  app.delete("/api/taxonomy-terms/:id", {
    schema: {
      tags: ["taxonomies"],
      params: idParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteTaxonomyTerm(id);
    if (!deleted) throw new NotFoundError("Taxonomy term");
    return reply.code(204).send();
  });
}
