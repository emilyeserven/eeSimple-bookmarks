// This module pairs the shared per-tab shell with a factory that specialises it per entity, so it
// intentionally exports a helper function alongside the component.
/* eslint-disable react-refresh/only-export-components */
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

/**
 * Build an entity-specific tab wrapper from its by-slug hook. Each slug-routed entity exports a
 * one-line wrapper (e.g. `CategoryEditTabWrapper`) so its view/edit tab routes stay thin: the wrapper
 * loads the entity by slug, then renders `TabWrapper` with the entity's not-found message.
 *
 * `slugParam` keeps the consumer-facing prop name entity-specific (e.g. `websiteSlug`) so existing
 * tab routes pass it unchanged.
 */
export function createTabWrapper<R extends { isLoading: boolean }, T, K extends string>(
  slugParam: K,
  useEntity: (slug: string) => R,
  selectEntity: (result: R) => T | undefined,
  notFoundMessage: string,
) {
  return function EntityTabWrapper(
    props: Record<K, string> & {
      title: string;
      description: string;
      children: (entity: T) => ReactNode;
    },
  ) {
    const result = useEntity(props[slugParam]);
    return (
      <TabWrapper
        entity={selectEntity(result)}
        isLoading={result.isLoading}
        notFoundMessage={notFoundMessage}
        title={props.title}
        description={props.description}
      >
        {props.children}
      </TabWrapper>
    );
  };
}
