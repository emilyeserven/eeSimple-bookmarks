/**
 * Human-readable English name for an ISO 639-1/639-2 language code (e.g. `"en"` → `"English"`),
 * via the standard `Intl.DisplayNames` API. Falls back to the uppercased code when the runtime
 * can't resolve it. Used to name a `Language` row auto-created from a detected code (scan/ISBN),
 * mirroring how a detected author/group name seeds a new row.
 */
export function languageDisplayName(code: string): string {
  try {
    const displayNames = new Intl.DisplayNames(["en"], {
      type: "language",
    });
    return displayNames.of(code) ?? code.toUpperCase();
  }
  catch {
    return code.toUpperCase();
  }
}
