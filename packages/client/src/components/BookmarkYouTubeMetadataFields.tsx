import type { useFetchMetadata } from "../hooks/useFetchMetadata";
import type { Bookmark, CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DateTimePicker } from "./DateTimePicker";
import { notifyError } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputAddon, InputGroup } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

type FetchMetadata = ReturnType<typeof useFetchMetadata>;

/** Build an error-toast message for a failed metadata fetch, appending the server's reason if any. */
function metadataErrorMessage(t: (key: string, options?: Record<string, unknown>) => string, label: string, diagnostics?: string[]): string {
  const reason = diagnostics?.length ? ` ${diagnostics.join("; ")}` : "";
  return `${t("Couldn't fetch {{label}} from YouTube.", {
    label,
  })}${reason}`;
}

interface BookmarkYouTubeMetadataFieldsProps {
  bookmark: Bookmark;
  fetchMetadata: FetchMetadata;
  /** The built-in Runtime property, when it exists and applies. */
  runtimeProp?: CustomProperty;
  /** The built-in Date Posted property, when it exists and applies. */
  datePostedProp?: CustomProperty;
  numberInputs: Record<string, string>;
  dateTimeInputs: Record<string, string>;
  onNumberChange: (id: string, value: string) => void;
  onDateTimeChange: (id: string, value: string) => void;
}

/**
 * The "Video" block of the bookmark properties form: the Runtime and Date Posted fields with their
 * fetch-from-YouTube buttons. Rendered only for YouTube bookmarks where at least one of the two
 * built-in properties applies. Extracted so `BookmarkPropertiesForm` stays a thin assembler.
 */
export function BookmarkYouTubeMetadataFields({
  bookmark,
  fetchMetadata,
  runtimeProp,
  datePostedProp,
  numberInputs,
  dateTimeInputs,
  onNumberChange,
  onDateTimeChange,
}: BookmarkYouTubeMetadataFieldsProps) {
  const {
    t,
  } = useTranslation();
  /** Fetch metadata and apply one extracted field, toasting when it's missing or the request fails. */
  async function fetchAndApply(
    label: string,
    apply: (meta: Awaited<ReturnType<FetchMetadata["mutateAsync"]>>) => boolean,
  ): Promise<void> {
    try {
      const meta = await fetchMetadata.mutateAsync({
        url: bookmark.url ?? "",
      });
      if (!apply(meta)) {
        notifyError(metadataErrorMessage(t, label, meta.diagnostics));
      }
    }
    catch {
      notifyError(metadataErrorMessage(t, label));
    }
  }

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">{t("Video")}</span>
      {runtimeProp && (
        <div className="space-y-1">
          <Label htmlFor={`property-${runtimeProp.id}`}>
            {t("Runtime (seconds)")}
          </Label>
          <InputGroup>
            <Input
              id={`property-${runtimeProp.id}`}
              type="number"
              className="pe-10"
              value={numberInputs[runtimeProp.id] ?? ""}
              onChange={event => onNumberChange(runtimeProp.id, event.target.value)}
            />
            <MetadataFetchButton
              fetchMetadata={fetchMetadata}
              title={t("Fetch runtime from YouTube")}
              onClick={() => fetchAndApply(t("runtime"), (meta) => {
                if (meta.durationSeconds === null) return false;
                onNumberChange(runtimeProp.id, String(meta.durationSeconds));
                return true;
              })}
            />
          </InputGroup>
        </div>
      )}
      {datePostedProp && (
        <div className="space-y-1">
          <Label htmlFor={`property-${datePostedProp.id}`}>{t("Date Posted")}</Label>
          <InputGroup>
            <DateTimePicker
              id={`property-${datePostedProp.id}`}
              format="date"
              value={dateTimeInputs[datePostedProp.id] ?? null}
              onChange={value => onDateTimeChange(datePostedProp.id, value ?? "")}
            />
            <MetadataFetchButton
              fetchMetadata={fetchMetadata}
              title={t("Fetch date posted from YouTube")}
              onClick={() => fetchAndApply(t("date posted"), (meta) => {
                if (meta.datePosted === null) return false;
                onDateTimeChange(datePostedProp.id, meta.datePosted);
                return true;
              })}
            />
          </InputGroup>
        </div>
      )}
    </div>
  );
}

/** The inline-end "fetch from YouTube" button shared by both metadata fields. */
function MetadataFetchButton({
  fetchMetadata,
  title,
  onClick,
}: {
  fetchMetadata: FetchMetadata;
  title: string;
  onClick: () => void;
}): ReactNode {
  return (
    <InputAddon align="inline-end">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title={title}
        aria-label={title}
        disabled={fetchMetadata.isPending}
        onClick={onClick}
      >
        {fetchMetadata.isPending
          ? <Loader2 className="size-4 animate-spin" />
          : <Sparkles className="size-4" />}
      </Button>
    </InputAddon>
  );
}
