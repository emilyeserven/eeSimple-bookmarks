import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkSortEditor } from "./BookmarkSortFields";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useLanguages } from "../hooks/useLanguages";
import { useTitleSortLanguage } from "../hooks/useTitleSortContext";
import { withSort } from "../lib/bookmarkSearch";
import { cn } from "../lib/utils";
import { useUiStore } from "../stores/uiStore";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { ResponsivePopover } from "./ui/responsive-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface BookmarkSortPopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Render a labeled "Sort" button (for the on-page listing box) instead of the icon-only trigger. */
  label?: boolean;
}

export function BookmarkSortPopover({
  open,
  onOpenChange,
  label = false,
}: BookmarkSortPopoverProps) {
  const {
    t,
  } = useTranslation();
  const isActive = useUiStore(s => s.filterContext?.search.sort != null);
  return (
    <ResponsivePopover
      title="Sort"
      open={open}
      onOpenChange={onOpenChange}
      trigger={label
        ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={t("Sort bookmarks")}
          >
            <ArrowUpDown className={cn("size-4", isActive && "text-primary")} />
            {t("Sort")}
            {isActive && <span className="size-1.5 rounded-full bg-primary" />}
          </Button>
        )
        : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("Sort bookmarks")}
          >
            <span className="relative">
              <ArrowUpDown className={cn("size-4", isActive && "text-primary")} />
              {isActive && (
                <span
                  className="
                    absolute -top-1 -right-1 size-1.5 rounded-full bg-primary
                  "
                />
              )}
            </span>
          </Button>
        )}
    >
      <BookmarkSortControls />
    </ResponsivePopover>
  );
}

function BookmarkSortControls() {
  const filterContext = useUiStore(s => s.filterContext);
  const pageKey = useUiStore(s => s.listingPage?.key);
  const sort = filterContext?.search.sort;
  const {
    data: allProperties = [],
  } = useCustomProperties();

  return (
    <div className="space-y-3">
      <BookmarkSortEditor
        value={sort}
        onChange={(next) => {
          if (filterContext) filterContext.onSearchChange(withSort(filterContext.search, next));
        }}
        properties={allProperties}
        allowRandom
      />
      {pageKey ? <TitleSortLanguageField pageKey={pageKey} /> : null}
    </div>
  );
}

/** Sentinel Select value for "follow the interface/display language" (Radix rejects an empty value). */
const DISPLAY_LANGUAGE = "__display__";

/**
 * Per-page "Sort titles by" language picker. Picks which of a bookmark's multilingual names its
 * title sorts by; defaults to the interface/display language. Persisted per listing page in uiStore
 * (like the view mode) — kept out of the shared `BookmarkSort` object so homepage sections and saved
 * filters are unaffected.
 */
function TitleSortLanguageField({
  pageKey,
}: {
  pageKey: string;
}) {
  const {
    t,
  } = useTranslation();
  const {
    languageId, setLanguage,
  } = useTitleSortLanguage(pageKey);
  const {
    data: languages = [],
  } = useLanguages();

  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm font-medium">{t("Sort titles by")}</Label>
      <Select
        value={languageId === "" ? DISPLAY_LANGUAGE : languageId}
        onValueChange={value => setLanguage(value === DISPLAY_LANGUAGE ? "" : value)}
      >
        <SelectTrigger
          size="sm"
          className="w-40"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DISPLAY_LANGUAGE}>{t("Display language")}</SelectItem>
          {languages.map(language => (
            <SelectItem
              key={language.id}
              value={language.id}
            >
              {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
