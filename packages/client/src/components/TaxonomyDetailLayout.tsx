import type { ReactNode } from "react";

interface Props<T> {
  isLoading: boolean;
  error: Error | null | undefined;
  entity: T | null | undefined;
  loadingLabel: string;
  notFoundMessage: string;
  listHref: string;
  listLabel: string;
  children: (entity: T) => ReactNode;
}

export function TaxonomyDetailLayout<T>({
  isLoading,
  error,
  entity,
  loadingLabel,
  notFoundMessage,
  listHref,
  listLabel,
  children,
}: Props<T>) {
  if (isLoading) return <p className="text-muted-foreground">{loadingLabel}</p>;
  if (error || !entity) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error?.message ?? notFoundMessage}</p>
        <a
          href={listHref}
          className="
            text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← {listLabel}
        </a>
      </div>
    );
  }
  return <>{children(entity)}</>;
}
