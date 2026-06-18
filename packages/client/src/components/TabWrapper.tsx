import type { ReactNode } from "react";

interface Props<T> {
  entity: T | undefined;
  isLoading: boolean;
  notFoundMessage: string;
  title: string;
  description: string;
  children: (entity: T) => ReactNode;
}

/** Shared shell for a single tab's content: handles loading/not-found states and renders a title + description header above the tab body. */
export function TabWrapper<T>({
  entity,
  isLoading,
  notFoundMessage,
  title,
  description,
  children,
}: Props<T>) {
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!entity) return <p className="text-destructive">{notFoundMessage}</p>;
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children(entity)}
    </section>
  );
}
