import type { ReactNode } from "react";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  onClick: (event: React.MouseEvent) => void; }) {
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
