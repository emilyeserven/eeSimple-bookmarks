import type { ReactNode } from "react";

/** Shared loading status line, matching the existing panel bodies. */
export function Loading() {
  return <p className="text-muted-foreground">Loading…</p>;
}

/** Shared error / not-found status line, matching the existing panel bodies. */
export function Problem({
  children,
}: {
  children: ReactNode;
}) {
  return <p className="text-destructive">{children}</p>;
}
