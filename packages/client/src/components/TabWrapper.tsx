import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();
  if (isLoading) return <p className="text-muted-foreground">{t("Loading…")}</p>;
  if (!entity) return <p className="text-destructive">{notFoundMessage}</p>;
  // A layout-driven tab passes an empty title + description (the rail label + section titles identify
  // it); drop the header entirely in that case so the body starts flush.
  const hasHeader = title !== "" || description !== "";
  return (
    <section className="space-y-4">
      {hasHeader
        ? (
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description !== "" ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
        )
        : null}
      {children(entity)}
    </section>
  );
}
