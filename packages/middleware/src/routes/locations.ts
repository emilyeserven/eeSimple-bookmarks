import type { FastifyInstance } from "fastify";
import type {
  CreateLocationChainInput,
  CreateLocationInput,
  SetLocationAncestorsInput,
  UpdateLocationInput,
} from "@eesimple/types";
import {
  autofillLocationWikipediaLinks,
  bulkDeleteLocations,
  createLocation,
  createLocationWithAncestors,
  deleteLocation,
  ensureLocationBoundary,
  getLocationTree,
  listLocations,
  refreshLocationCoordinates,
  setLocationAncestors,
  updateLocation,
} from "@/services/locations";
import { geocodeLocation } from "@/services/geocoding";
import { wikidataGeocode } from "@/services/wikidataGeocoding";
import { labeledWebsitesSchema } from "@/routes/labeledWebsitesSchema";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

const locationParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const alternateNamesSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["value"],
    additionalProperties: false,
    properties: {
      value: {
        type: "string",
        minLength: 1,
      },
      style: {
        type: "string",
        nullable: true,
      },
    },
  },
} as const;

/** A GeoJSON area outline (Polygon / MultiPolygon) captured from a geocoding candidate. */
const boundarySchema = {
  type: "object",
  nullable: true,
  required: ["type", "coordinates"],
  additionalProperties: false,
  properties: {
    type: {
      type: "string",
      enum: ["Polygon", "MultiPolygon"],
    },
    // Nested coordinate arrays; left untyped (GeoJSON ring depth varies by geometry type).
    coordinates: {
      type: "array",
    },
  },
} as const;

/** The editable location columns shared by create and update bodies. */
const locationFields = {
  englishName: {
    type: "string",
    nullable: true,
  },
  description: {
    type: ["string", "null"],
  },
  alternateNames: alternateNamesSchema,
  latitude: {
    type: "number",
    nullable: true,
  },
  longitude: {
    type: "number",
    nullable: true,
  },
  mapUrl: {
    type: "string",
    nullable: true,
  },
  plusCode: {
    type: "string",
    nullable: true,
  },
  placeType: {
    type: "string",
    nullable: true,
  },
  countryCode: {
    type: "string",
    nullable: true,
  },
  boundary: boundarySchema,
  wikidataId: {
    type: "string",
    nullable: true,
  },
  usesWikidataCoordinates: {
    type: "boolean",
  },
  hiddenOnMainMap: {
    type: "boolean",
  },
  officialLink: {
    type: "string",
    nullable: true,
  },
  wikipediaLinkEn: {
    type: "string",
    nullable: true,
  },
  wikipediaLinkLocal: {
    type: "string",
    nullable: true,
  },
  sortOrder: {
    type: "integer",
  },
  parentId: {
    type: "string",
    format: "uuid",
    nullable: true,
  },
  tagIds: {
    type: "array",
    items: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createLocationBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...locationFields,
  },
} as const;

const updateLocationBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...locationFields,
    labeledWebsites: labeledWebsitesSchema,
  },
} as const;

const createChainBody = {
  type: "object",
  required: ["location"],
  additionalProperties: false,
  properties: {
    location: createLocationBody,
    ancestors: {
      type: "array",
      items: createLocationBody,
    },
    parentId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
} as const;

const setAncestorsBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    ancestors: {
      type: "array",
      items: createLocationBody,
    },
    parentId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
} as const;

const lookupQuery = {
  type: "object",
  required: ["q"],
  properties: {
    q: {
      type: "string",
    },
    // Forces the Wikidata fallback instead of the default Nominatim-first auto path, for the
    // "Search Wikidata instead" action in the lookup box's button group.
    source: {
      type: "string",
      enum: ["wikidata"],
    },
  },
} as const;

/** Routes for the Locations taxonomy, mounted under `/api/locations`. */
export async function locationRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/locations", "locations", bulkDeleteLocations);

  app.get("/api/locations", {
    schema: {
      tags: ["locations"],
    },
  }, async () => listLocations());

  app.get("/api/locations/tree", {
    schema: {
      tags: ["locations"],
    },
  }, async () => getLocationTree());

  app.get("/api/locations/lookup", {
    schema: {
      tags: ["locations"],
      querystring: lookupQuery,
    },
  }, async (req) => {
    const {
      q, source,
    } = req.query as { q: string;
      source?: "wikidata"; };
    return source === "wikidata" ? wikidataGeocode(q) : geocodeLocation(q);
  });

  app.post("/api/locations", {
    schema: {
      tags: ["locations"],
      body: createLocationBody,
    },
  }, async (req, reply) => {
    const location = await createLocation(req.body as CreateLocationInput);
    return reply.code(201).send(location);
  });

  app.post("/api/locations/chain", {
    schema: {
      tags: ["locations"],
      body: createChainBody,
    },
  }, async (req, reply) => {
    const location = await createLocationWithAncestors(req.body as CreateLocationChainInput);
    return reply.code(201).send(location);
  });

  app.post("/api/locations/:id/ancestors", {
    schema: {
      tags: ["locations"],
      params: locationParams,
      body: setAncestorsBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const location = await setLocationAncestors(id, req.body as SetLocationAncestorsInput);
    if (!location) throw new NotFoundError("Location");
    return location;
  });

  app.patch("/api/locations/:id", {
    schema: {
      tags: ["locations"],
      params: locationParams,
      body: updateLocationBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const location = await updateLocation(id, req.body as UpdateLocationInput);
    if (!location) throw new NotFoundError("Location");
    return location;
  });

  app.post("/api/locations/:id/refresh-boundary", {
    schema: {
      tags: ["locations"],
      params: locationParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const location = await ensureLocationBoundary(id);
    if (!location) throw new NotFoundError("Location");
    return location;
  });

  app.post("/api/locations/:id/refresh-coordinates", {
    schema: {
      tags: ["locations"],
      params: locationParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const location = await refreshLocationCoordinates(id);
    if (!location) throw new NotFoundError("Location");
    return location;
  });

  app.post("/api/locations/:id/autofill-wikipedia-links", {
    schema: {
      tags: ["locations"],
      params: locationParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const location = await autofillLocationWikipediaLinks(id);
    if (!location) throw new NotFoundError("Location");
    return location;
  });

  app.delete("/api/locations/:id", {
    schema: {
      tags: ["locations"],
      params: locationParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteLocation(id);
    if (!deleted) throw new NotFoundError("Location");
    return reply.code(204).send();
  });
}
