import i18n from "@/i18n";

/**
 * Maps a server error `code` (from the API error envelope — see
 * `packages/middleware/src/utils/errors.ts`) to a translated toast message. The middleware stays
 * i18n-free: it emits a stable `code` + English `message` + optional `params`, and translation
 * happens here. A code without an entry returns `undefined` so {@link describeError} falls back to
 * the server's raw English `message` (the "unknown/uncoded errors stay English" rule).
 *
 * Each entry is a literal `i18n.t("…")` call so `pnpm i18n:extract` / `i18n:check-stale` can see the
 * phrase keys statically. `params` (entity/name/domain/…) are interpolated as sent — entity tokens
 * are English for now; the owner refines the localized templates over time.
 */
export type ErrorParams = Record<string, string | number>;

type Translator = (params?: ErrorParams) => string;

const ERROR_CODE_MESSAGES: Record<string, Translator> = {
  notFound: p => i18n.t("{{entity}} not found", {
    entity: p?.entity ?? i18n.t("Item"),
  }),
  duplicateName: p =>
    p?.entity != null && p?.name != null
      ? i18n.t("A {{entity}} named \"{{name}}\" already exists", {
        entity: p.entity,
        name: p.name,
      })
      : i18n.t("That name is already taken"),
  builtInImmutable: () => i18n.t("Built-in items can't be modified or deleted"),
  storageUnconfigured: () => i18n.t("File storage is not configured"),
  noFileUploaded: () => i18n.t("No file uploaded"),
};

/**
 * Translate a server error `code` to a localized message, or `undefined` when the code has no
 * mapping (so the caller falls back to the raw English `message`). `validation` / `error` /
 * `internal` / `schemaValidation` / `conflict` deliberately have no entry — their server `message`
 * is the specific, human-authored text worth surfacing verbatim (a `conflict` message names the
 * exact clash).
 */
export function translateErrorCode(code: string, params?: ErrorParams): string | undefined {
  return ERROR_CODE_MESSAGES[code]?.(params);
}
