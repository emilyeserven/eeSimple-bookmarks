import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface BookmarkPaginationProps {
  page: number;
  totalPages: number;
  /** 1-indexed index of the first item shown on the current page. */
  rangeStart: number;
  /** 1-indexed index of the last item shown on the current page. */
  rangeEnd: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Build a compact list of page numbers to render, collapsing long gaps to an ellipsis. Always
 * includes the first and last page plus a window around the current page.
 */
function pageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

/** Prev/next + windowed page-number pager shown below a paginated bookmark listing. */
export function BookmarkPagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  total,
  onPageChange,
}: BookmarkPaginationProps) {
  const {
    t,
  } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={t("Bookmark pages")}
      className="
        flex flex-col items-center justify-between gap-3 pt-2
        sm:flex-row
      "
    >
      <p className="text-sm text-muted-foreground">
        {t("Showing {{rangeStart}}–{{rangeEnd}} of {{total}}", {
          rangeStart,
          rangeEnd,
          total,
        })}
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
          {t("Prev")}
        </Button>

        {pageWindow(page, totalPages).map((entry, index) =>
          entry === "ellipsis"
            ? (
              <span

                key={`ellipsis-${index}`}
                className="px-2 text-sm text-muted-foreground"
              >
                …
              </span>
            )
            : (
              <Button
                key={entry}
                type="button"
                variant={entry === page ? "default" : "outline"}
                size="sm"
                aria-current={entry === page ? "page" : undefined}
                onClick={() => onPageChange(entry)}
              >
                {entry}
              </Button>
            ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("Next")}
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
