// Public barrel for the shared types package. Re-export domain modules only — never declare types
// here. Intra-package specifiers MUST carry `.js` extensions (native ESM output).
export * from "./errors.js";
export * from "./items.js";
