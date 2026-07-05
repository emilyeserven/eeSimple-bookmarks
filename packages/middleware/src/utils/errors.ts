/**
 * Shared error envelope for the API.
 *
 * Every user-facing failure is an {@link AppError}: it carries a stable machine `code`, the HTTP
 * `statusCode`, an English `message` (the fallback shown when the client can't translate the code),
 * and optional interpolation `params`. The central `setErrorHandler` in `app.ts` serializes any
 * thrown `AppError` to `{ message, code, statusCode, params? }` — routes just `throw`, they don't
 * build error bodies. The client maps `code` → a translated phrase (see `lib/errorMessages.ts`);
 * unmapped codes fall back to the English `message`.
 *
 * The middleware stays i18n-free: it emits codes + English, never translated text.
 */

/** Interpolation values echoed back to the client so it can render a localized message. */
export type ErrorParams = Record<string, string | number>;

/**
 * Stable error codes. This union is the single source of truth the client's code→phrase map is
 * checked against — add a code here and give it a client mapping (or let it fall back to English).
 */
export type ErrorCode
  = | "notFound"
    | "duplicateName"
    | "duplicateDomain"
    | "duplicateUrl"
    | "duplicateChannelKey"
    | "builtInImmutable"
    | "validation"
    | "cycle"
    | "invalidReassignTarget"
    | "storageUnconfigured"
    | "noFileUploaded"
    | "unsupportedImage"
    | "imageTooLarge"
    | "maxImagesReached"
    | "schemaValidation"
    | "conflict"
    | "internal";

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: ErrorCode,
    readonly statusCode: number,
    readonly params?: ErrorParams,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** The JSON body sent for an {@link AppError} — the uniform error envelope. */
export function errorBody(err: AppError) {
  return {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    ...(err.params && {
      params: err.params,
    }),
  };
}

// ── Semantic subclasses used directly by routes/services ────────────────────────────────────────

/** 404 — a looked-up entity doesn't exist. `entity` is an English label (e.g. "Bookmark"). */
export class NotFoundError extends AppError {
  constructor(entity: string, message = `${entity} not found`) {
    super(message, "notFound", 404, {
      entity,
    });
  }
}

/** 409 — a create/rename collides with an existing row's name in the same scope. */
export class DuplicateNameError extends AppError {
  constructor(entity: string, name: string, message = `A ${entity} named "${name}" already exists`) {
    super(message, "duplicateName", 409, {
      entity,
      name,
    });
  }
}

/** 403 — attempt to modify or delete a seeded built-in row. */
export class BuiltInImmutableError extends AppError {
  constructor(message = "Built-in items can't be modified or deleted", entity?: string) {
    super(message, "builtInImmutable", 403, entity
      ? {
        entity,
      }
      : undefined);
  }
}

/** 400 — a request failed a domain/business-rule validation. */
export class ValidationError extends AppError {
  constructor(message: string, params?: ErrorParams) {
    super(message, "validation", 400, params);
  }
}

/** 400 — moving a tree node under itself or a descendant. */
export class CycleError extends AppError {
  constructor(message: string, entity?: string) {
    super(message, "cycle", 400, entity
      ? {
        entity,
      }
      : undefined);
  }
}

/** 400 — a delete's reassignment target is missing or is the row being deleted. */
export class ReassignTargetError extends AppError {
  constructor(message = "Invalid reassignment target") {
    super(message, "invalidReassignTarget", 400);
  }
}

/** 503 — object storage isn't configured, so image upload/serving is unavailable. */
export class StorageUnconfiguredError extends AppError {
  constructor(message = "Image storage is not configured") {
    super(message, "storageUnconfigured", 503);
  }
}

/** 400 — a multipart upload arrived with no file part. */
export class NoFileUploadedError extends AppError {
  constructor(message = "No file uploaded") {
    super(message, "noFileUploaded", 400);
  }
}

/** 400 — the uploaded/target bytes weren't a supported image. */
export class UnsupportedImageError extends AppError {
  constructor(message = "Unsupported or invalid image") {
    super(message, "unsupportedImage", 400);
  }
}

/** 413 — the uploaded image exceeded the size cap. */
export class ImageTooLargeError extends AppError {
  constructor(message = "Image is too large") {
    super(message, "imageTooLarge", 413);
  }
}

/** 409 — the owner already has the maximum number of images. */
export class MaxImagesReachedError extends AppError {
  constructor(message = "This item already has the maximum number of images") {
    super(message, "maxImagesReached", 409);
  }
}
