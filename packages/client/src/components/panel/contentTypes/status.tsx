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

/** Wraps a list query, rendering loading/error/not-found states then calling children with the resolved item. */
export function WithPanelItem<T extends { id: string }>({
  queryResult,
  id,
  notFoundMessage,
  children,
}: {
  queryResult: { data: T[] | undefined;
    isLoading: boolean;
    error: Error | null; };
  id: string;
  notFoundMessage: string;
  children: (item: T) => ReactNode;
}): ReactNode {
  if (queryResult.isLoading) return <Loading />;
  if (queryResult.error) return <Problem>{queryResult.error.message}</Problem>;
  const item = (queryResult.data ?? []).find(i => i.id === id);
  if (!item) return <Problem>{notFoundMessage}</Problem>;
  return children(item);
}
