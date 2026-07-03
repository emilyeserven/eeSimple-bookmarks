import type { Language } from "@eesimple/types";

/**
 * Read-only detail body for a single language. Shared by the View tab and the right panel's View,
 * so both surfaces show the same fields.
 */
export function LanguageDetail({
  language,
}: { language: Language }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Slug</dt>
      <dd className="font-mono">{language.slug}</dd>
      <dt className="text-muted-foreground">ISO code</dt>
      <dd className="font-mono">{language.isoCode ?? "—"}</dd>
      <dt className="text-muted-foreground">Bookmarks</dt>
      <dd>{language.bookmarkCount ?? 0}</dd>
      <dt className="text-muted-foreground">Built-in</dt>
      <dd>{language.builtIn ? "Yes — name is fixed" : "No"}</dd>
      <dt className="text-muted-foreground">Added</dt>
      <dd>{new Date(language.createdAt).toLocaleDateString()}</dd>
    </dl>
  );
}
