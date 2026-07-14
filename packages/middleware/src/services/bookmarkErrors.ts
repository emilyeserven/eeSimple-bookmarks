import { AppError } from "@/utils/errors";

/** Thrown when a create/update would collide with an existing bookmark's URL. */
export class DuplicateUrlError extends AppError {
  constructor(url: string) {
    super(`A bookmark with this URL already exists: ${url}`, "duplicateUrl", 409, {
      url,
    });
  }
}
