import type { Row } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";

import i18n from "../../i18n";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Expand/collapse chevron for a row in a flattened, expandable tree table. Renders a toggle button
 * when the row has children, or a same-size spacer so leaf rows stay aligned.
 */
export function TreeExpandToggle<T>({
  row,
}: { row: Row<T> }) {
  if (!row.getCanExpand()) {
    return (
      <span
        className="inline-block size-4"
        aria-hidden="true"
      />
    );
  }
  return (
    <button
      type="button"
      data-no-row-click
      aria-label={row.getIsExpanded() ? i18n.t("Collapse") : i18n.t("Expand")}
      onClick={row.getToggleExpandedHandler()}
      className="
        flex size-4 items-center justify-center text-muted-foreground
        hover:text-foreground
      "
    >
      {row.getIsExpanded()
        ? <ChevronDown className="size-4" />
        : <ChevronRight className="size-4" />}
    </button>
  );
}

/**
 * Small square/round thumbnail cell shared by the entity tables (website favicon, channel avatar).
 * Falls back to `fallback` when no image is set or the image fails to load.
 */
export function ImageCell({
  src, fallback, shape = "sm",
}: { src?: string | null;
  fallback: ReactNode;
  shape?: "sm" | "full"; }) {
  const [failed, setFailed] = useState(false);
  const show = src != null && !failed;
  return (
    <span
      className={cn(
        `
          flex size-7 shrink-0 items-center justify-center overflow-hidden
          bg-muted text-muted-foreground
        `,
        shape === "full" ? "rounded-full" : "rounded-sm",
      )}
    >
      {show
        ? (
          <img
            src={src ?? undefined}
            alt=""
            className={cn("size-full", shape === "full"
              ? "object-cover"
              : "object-contain")}
            onError={() => setFailed(true)}
          />
        )
        : fallback}
    </span>
  );
}

/** A compact ghost "edit" pencil button linking to an entity's edit page (used as a table Actions cell). */
export function EditActionCell({
  to, params, label, onClick,
}: { to: string;
  params: Record<string, string>;
  label: string;
  onClick?: (event: React.MouseEvent) => void; }) {
  return (
    <div
      className="flex justify-end"
      data-no-row-click
    >
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="size-7"
      >
        <Link
          // The route is validated by the caller; the generic string keeps this cell reusable.
          to={to as never}
          params={params as never}
          onClick={onClick}
        >
          <Pencil className="size-4" />
          <span className="sr-only">{label}</span>
        </Link>
      </Button>
    </div>
  );
}
