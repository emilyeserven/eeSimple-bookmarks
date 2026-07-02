import type {
  EntityPaletteConfig,
  EntityPaletteField,
  PaletteEntity,
} from "@/lib/entityPaletteRegistry";
import type { EntityRoute } from "@/lib/entityRoutes";
import type { Category, MediaType } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { categoriesApi, mediaTypesApi } from "@/lib/api/taxonomies";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { ENTITY_PALETTE_CONFIGS } from "@/lib/entityPaletteRegistry";
import { matchEntityRoute } from "@/lib/entityRoutes";

/** The matched slug-routed entity behind the current page, resolved for CMD+K quick-actions. */
export interface MatchedEntityContext {
  route: EntityRoute;
  config: EntityPaletteConfig;
  slug: string;
  /** The resolved entity, or `undefined` while its list query loads. */
  entity: PaletteEntity | undefined;
  /** Display name (falls back to the route's singular while loading). */
  name: string;
  viewPath: string;
  editPath: string;
  /** Quick-action fields, with built-in-guarded ones already filtered out. */
  fields: readonly EntityPaletteField[];
  /** PATCH the entity with a field-named toast and cache invalidation. */
  saveField: (label: string, patch: Record<string, unknown>) => void;
}

/** Options for the "entity-choice" sub-palette, loaded only while one can be shown. */
export interface EntityChoiceOptions {
  categories: Pick<Category, "id" | "name">[];
  mediaTypes: Pick<MediaType, "id" | "name">[];
}

/**
 * The CMD+K quick-action context for whatever slug-routed entity page the user is on. One
 * registry-driven hook instead of a `use<Entity>Context` per entity: the route matcher picks the
 * entity kind from the pathname (`ENTITY_ROUTES`), and a **single** list query — gated on the
 * palette being open — resolves the entity from the kind's existing query cache. Mounted app-wide
 * by `useCommandPaletteData`, so the gating is what keeps it free on every non-entity page.
 */
export function useEntityCommandContext(open: boolean): {
  matched: MatchedEntityContext | null;
  choiceOptions: EntityChoiceOptions;
} {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const match = matchEntityRoute(pathname);
  const config = match ? ENTITY_PALETTE_CONFIGS[match.route.kind] : null;
  const queryClient = useQueryClient();

  // Passing the config's own listFn (not an inline closure) keeps the query keyed purely by the
  // entity's existing list key, so the palette shares that cache.
  const listFn = config?.listFn;
  const updateFn = config?.updateFn;
  const {
    data: entities,
  } = useQuery({
    queryKey: config ? [...config.queryKey] : ["entity-command-context", "none"],
    queryFn: listFn ?? (() => Promise.resolve([])),
    enabled: open && listFn !== undefined,
  });

  const mutation = useMutation({
    mutationFn: ({
      id, patch,
    }: { id: string;
      patch: Record<string, unknown>;
      label: string; }) =>
      updateFn ? updateFn(id, patch) : Promise.resolve(undefined),
    onSuccess: (_data, variables) => {
      notifyFieldSaved(variables.label);
      for (const key of [config?.queryKey ?? [], ...(config?.extraInvalidateKeys ?? [])]) {
        void queryClient.invalidateQueries({
          queryKey: [...key],
        });
      }
    },
    onError: (error, variables) => {
      notifyFieldSaveError(variables.label, error instanceof Error ? error.message : undefined);
    },
  });

  // The choice sub-palette's option lists, fetched only while a matched entity declares one.
  const hasChoiceField = Boolean(config?.fields?.some(field => field.type === "choice"));
  const {
    data: categories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    enabled: open && hasChoiceField,
  });
  const {
    data: mediaTypes,
  } = useQuery({
    queryKey: ["media-types"],
    queryFn: () => mediaTypesApi.list(),
    enabled: open && hasChoiceField,
  });

  if (!match || !config) {
    return {
      matched: null,
      choiceOptions: {
        categories: [],
        mediaTypes: [],
      },
    };
  }

  const entity = entities?.find(candidate => candidate.slug === match.slug);
  const name = (config.getName && entity ? config.getName(entity) : undefined)
    ?? (entity as { name?: string } | undefined)?.name
    ?? match.route.singular;
  const fields = (config.fields ?? []).filter(
    field => !entity || !("isEditable" in field) || !field.isEditable || field.isEditable(entity),
  );

  return {
    matched: {
      route: match.route,
      config,
      slug: match.slug,
      entity,
      name,
      viewPath: `${match.route.prefix}/${match.slug}/general`,
      editPath: `${match.route.prefix}/${match.slug}/edit/general`,
      fields,
      saveField: (label, patch) => {
        if (!entity) return;
        mutation.mutate({
          id: entity.id,
          patch,
          label,
        });
      },
    },
    choiceOptions: {
      categories: categories ?? [],
      mediaTypes: mediaTypes ?? [],
    },
  };
}
