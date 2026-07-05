import type { FastifyInstance } from "fastify";
import type { CreateBookInput, UpdateBookInput } from "@eesimple/types";
import {
  bulkDeleteBooks,
  createBook,
  deleteBook,
  DuplicateBookError,
  listBooks,
  updateBook,
} from "@/services/books";
import { importIsbnCoverForBook } from "@/services/isbn";
import { importKavitaCoverForBook } from "@/services/kavita";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { registerTaxonomyImageRoutes } from "@/routes/taxonomyImageRoutes";

const bookParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

/** Kavita/media-property data fields shared by the create and update bodies. */
const bookDataFields = {
  sortOrder: {
    type: "integer",
  },
  mediaPropertyId: {
    type: ["string", "null"],
    format: "uuid",
  },
  kavitaSeriesId: {
    type: ["integer", "null"],
  },
  kavitaLibraryId: {
    type: ["integer", "null"],
  },
  kavitaSeriesName: {
    type: ["string", "null"],
  },
  isbn: {
    type: ["string", "null"],
  },
  releaseYear: {
    type: ["integer", "null"],
  },
} as const;

const createBookBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...bookDataFields,
  },
} as const;

const updateBookBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...bookDataFields,
  },
} as const;

/** CRUD routes for the Books taxonomy, mounted under `/api/books`. */
export async function bookRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/books", "books", bulkDeleteBooks);

  app.get("/api/books", {
    schema: {
      tags: ["books"],
    },
  }, async () => listBooks());

  app.post("/api/books", {
    schema: {
      tags: ["books"],
      body: createBookBody,
    },
  }, async (req, reply) => {
    try {
      const book = await createBook(req.body as CreateBookInput);
      return reply.code(201).send(book);
    }
    catch (err) {
      if (err instanceof DuplicateBookError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/books/:id", {
    schema: {
      tags: ["books"],
      params: bookParams,
      body: updateBookBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const book = await updateBook(id, req.body as UpdateBookInput);
      if (!book) return reply.code(404).send({
        message: "Book not found",
      });
      return book;
    }
    catch (err) {
      if (err instanceof DuplicateBookError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/books/:id", {
    schema: {
      tags: ["books"],
      params: bookParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteBook(id);
    if (!deleted) return reply.code(404).send({
      message: "Book not found",
    });
    return reply.code(204).send();
  });

  registerTaxonomyImageRoutes(app, "/api/books", "book", "books", [
    {
      path: "kavita-cover",
      run: importKavitaCoverForBook,
      errorMessages: {
        not_linked: "Book is not linked to a Kavita series",
        cover_unavailable: "Could not fetch the cover from Kavita",
      },
    },
    {
      path: "isbn-cover",
      run: importIsbnCoverForBook,
      errorMessages: {
        no_isbn: "Book has no ISBN on file",
        isbn_not_found: "No book found for that ISBN",
        cover_unavailable: "Could not fetch a cover for that ISBN",
      },
    },
  ]);
}
