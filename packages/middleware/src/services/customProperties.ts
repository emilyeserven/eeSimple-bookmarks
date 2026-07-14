/**
 * Custom properties service — barrel re-export.
 *
 * The implementation is split across sibling modules to keep each file cohesive:
 *  - `customPropertyRelations.ts` — the leaf: value/relation writes + readers (category/media-type
 *    links, calculate operands) and the reserved built-in slug constants.
 *  - `customPropertyCrud.ts` — the error classes, CRUD (list/get/create/update/delete/bulkDelete),
 *    and the insert/update patch builders.
 *  - `customPropertyBuiltins.ts` — the `ensure*`/`get*PropertyId` boot-seeded built-in properties
 *    (Runtime, Date Posted, Content Status, Progress, Page Range, Sections, ISBN / ASIN).
 *
 * This file stays a pure barrel — no logic lives here. Import from `@/services/customProperties`
 * as before; sibling modules import each other's concrete files directly, never this barrel, so
 * there is no import cycle.
 */
export * from "./customPropertyCrud";
export * from "./customPropertyRelations";
export * from "./customPropertyBuiltins";
