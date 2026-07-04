import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface BookmarkUrlCleanupBannerProps {
  urlCleanup: { original: string;
    applied: boolean; } | null;
  urlShortener: { nudge: boolean;
    expandedUrl: string | null; };
  onUndo: () => void;
}

/** "Shortened from" disclosure shown after URL cleanup is applied. */
export function BookmarkUrlCleanupBanner({
  urlCleanup,
  urlShortener,
  onUndo,
}: BookmarkUrlCleanupBannerProps) {
  const {
    t,
  } = useTranslation();
  if (!urlCleanup?.applied) return null;
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {urlShortener.nudge && (
        <p
          className="
            text-amber-600
            dark:text-amber-500
          "
        >
          {t("This looks like a shortened link — consider using the full URL.")}
        </p>
      )}
      <p>
        {t("Shortened from")}
        {" "}
        <span className="font-mono break-all">{urlCleanup.original}</span>
        {" · "}
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={onUndo}
        >
          {t("Undo")}
        </Button>
      </p>
      {urlShortener.expandedUrl && (
        <p>
          {t("Will be saved as")}
          {" "}
          <span className="font-mono break-all">{urlShortener.expandedUrl}</span>
        </p>
      )}
    </div>
  );
}
