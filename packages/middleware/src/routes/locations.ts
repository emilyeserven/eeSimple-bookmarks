import type { FastifyInstance } from "fastify";
import type {
  CreateLocationChainInput,
  CreateLocationInput,
  UpdateLocationInput,
} from "@eesimple/types";
import {
  bulkDeleteLocations,
  createLocation,
  createLocationWithAncestors,
  deleteLocation,
  getLocationTree,
  listLocations,
  LocationCycleError,
  updateLocation,
} from "@/services/locations";
import { geocodeLocation } from "@/services/geocoding";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

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

/** The editable location columns shared by create and update bodies. */
const locationFields = {
  romanizedName: {
    type: "string",
    nullable: true,
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
  },
} as const;

const lookupQuery = {
  type: "object",
  required: ["q"],
  properties: {
    q: {
      type: "string",
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
      q,
    } = req.query as { q: string };
    return geocodeLocation(q);
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

  app.patch("/api/locations/:id", {
    schema: {
      tags: ["locations"],
      params: locationParams,
      body: updateLocationBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const location = await updateLocation(id, req.body as UpdateLocationInput);
      if (!location) return reply.code(404).send({
        message: "Location not found",
      });
      return location;
    }
    catch (err) {
      if (err instanceof LocationCycleError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      throw err;
    }
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
    if (!deleted) return reply.code(404).send({
      message: "Location not found",
    });
    return reply.code(204).send();
  });
}
