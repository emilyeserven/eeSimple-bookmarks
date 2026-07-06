import { useState } from "react";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useIsbnFromAmazonUrl } from "../hooks/useIsbnFromAmazonUrl";
import { describeError } from "../lib/apiError";
import { notifyError } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AmazonIsbnLookupProps {
  /** Input id, so a caller can pair it with its own `<Label htmlFor>`. */
  id: string;
  autoFocus?: boolean;
  /** Called with a resolved ISBN-13 so the caller can feed it into the existing ISBN lookup flow. */
  onResolved: (isbn: string) => void;
}

/**
 * A one-line "paste an Amazon product link" box that resolves it to an ISBN via
 * `/api/isbn/from-amazon-url` (the same ASIN/page-scrape extraction the bookmark URL scan already
 * uses) and hands the result to the caller — it never calls the ISBN lookup itself, so Kavita /
 * Open Library / Google Books stay a single fallback chain. Modeled on `KavitaSeriesLookup`.
 */
export function AmazonIsbnLookup({
  id, autoFocus, onResolved,
}: AmazonIsbnLookupProps) {
  const {
    t,
  } = useTranslation();
  const [url, setUrl] = useState("");
  const lookup = useIsbnFromAmazonUrl();

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
      notifyError(describeError(err, t("Could not read that Amazon page")));
      return;
    }
    if (result.isbn === null) {
      notifyError(t("No ISBN could be found on that Amazon page."));
      return;
    }
    onResolved(result.isbn);
    setUrl("");
  }

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        placeholder={t("Paste an Amazon product link…")}
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
