import { useState } from "react";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useIsbnFromBookUrl } from "../hooks/useIsbnFromBookUrl";
import { describeError } from "../lib/apiError";
import { notifyError } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BookUrlIsbnLookupProps {
  /** Input id, so a caller can pair it with its own `<Label htmlFor>`. */
  id: string;
  autoFocus?: boolean;
  /** Called with a resolved ISBN-13 so the caller can feed it into the existing ISBN lookup flow. */
  onResolved: (isbn: string) => void;
}

/**
 * A one-line "paste a book product link" box that resolves an Amazon or honto.jp product URL to an
 * ISBN via `/api/isbn/from-book-url` (the same ASIN/page-scrape extraction the bookmark URL scan
 * already uses) and hands the result to the caller — it never calls the ISBN lookup itself, so
 * Kavita / Open Library / Google Books stay a single fallback chain. Modeled on `KavitaSeriesLookup`.
 */
export function BookUrlIsbnLookup({
  id, autoFocus, onResolved,
}: BookUrlIsbnLookupProps) {
  const {
    t,
  } = useTranslation();
  const [url, setUrl] = useState("");
  const lookup = useIsbnFromBookUrl();

  async function handleLookup(): Promise<void> {
    const trimmed = url.trim();
    if (!trimmed) return;
    let result;
    try {
      result = await lookup.mutateAsync({
        url: trimmed,
      });
    }
    catch (err) {
      notifyError(describeError(err, t("Could not read that page")));
      return;
    }
    if (result.isbn === null) {
      notifyError(t("No ISBN could be found on that page."));
      return;
    }
    onResolved(result.isbn);
    setUrl("");
  }

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        placeholder={t("Paste an Amazon or honto.jp product link…")}
        value={url}
        onChange={event => setUrl(event.target.value)}
        autoFocus={autoFocus}
      />
      <Button
        type="button"
        variant="outline"
        disabled={lookup.isPending || url.trim().length === 0}
        onClick={() => void handleLookup()}
      >
        {lookup.isPending
          ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("Looking up…")}
            </>
          )
          : t("Fetch ISBN")}
      </Button>
    </div>
  );
}
