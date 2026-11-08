import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import { AppError, errorBody } from "@/utils/errors";

/**
 * The single API error handler (registered via `app.setErrorHandler` in `app.ts`).
 *
 * Serializes a thrown {@link AppError} to the uniform `{ message, code, statusCode, params? }`
 * envelope so the client can translate `code`; a Fastify schema-validation error becomes a
 * `schemaValidation`-coded 400; anything else is a generic `error`/`internal` fallback (5xx are
 * logged). The middleware never translates — it emits codes + English text only.
 */
export function errorHandler(err: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  if (err instanceof AppError) {
    return reply.code(err.statusCode).send(errorBody(err));
  }
  if (err.validation) {
    const status = err.statusCode ?? 400;
    return reply.code(status).send({
      message: err.message,
      code: "schemaValidation",
      statusCode: status,
    });
  }
  const status = err.statusCode ?? 500;
  if (status >= 500) req.log.error(err);
  return reply.code(status).send({
    message: err.message || "Internal Server Error",
    code: status >= 500 ? "internal" : "error",
    statusCode: status,
  });
}
