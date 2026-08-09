import type { Bookmark, DuplicateGroup } from "@eesimple/types";

import { useEffect, useMemo, useState } from "react";

import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useCategories } from "../hooks/useCategories";
import { useMergeBookmarks } from "../hooks/useDuplicates";
import { bookmarksApi } from "../lib/api/bookmarks";
import {
  associationSummary,
  buildFieldChoices,
  differingUnits,
} from "../lib/mergePlanner";
import { notifyError, notifySuccess } from "../lib/notifications";

/**
 * Controller for the merge review dialog: loads the group's full bookmarks, tracks the survivor +
 * per-unit picks (reset whenever another group opens), and applies the merge. The planning logic
 * is the pure `lib/mergePlanner.ts`; this hook only wires state and queries.
 */
export function useMergeBookmarksDialog(group: DuplicateGroup | null, onClose: () => void) {
  const {
    t,
  } = useTranslation();
  const memberIds = useMemo(() => group?.members.map(member => member.id) ?? [], [group]);
  const memberQueries = useQueries({
    queries: memberIds.map(id => ({
      // The same key `useBookmark` uses, so bookmark edits invalidate these too.
      queryKey: ["bookmarks", "detail", id],
      queryFn: () => bookmarksApi.get(id),
      enabled: group !== null,
    })),
  });
  const members: Bookmark[] | null = memberQueries.length > 0 && memberQueries.every(query => query.data)
    ? memberQueries.map(query => query.data as Bookmark)
    : null;

  const [survivorId, setSurvivorId] = useState<string | null>(null);
  const [unitChoices, setUnitChoices] = useState<Record<string, string>>({});
  useEffect(() => {
    setSurvivorId(group?.members[0]?.id ?? null);
    setUnitChoices({});
  }, [group]);

  const units = useMemo(() => (members ? differingUnits(members) : []), [members]);
  const summary = useMemo(() => (members ? associationSummary(members) : []), [members]);

  const {
    data: categories = [],
  } = useCategories();
  const resolveCategoryName = (id: string): string | null =>
    categories.find(category => category.id === id)?.name ?? null;

  const merge = useMergeBookmarks();

  function chooseUnit(unitKey: string, memberId: string): void {
    setUnitChoices(previous => ({
      ...previous,
      [unitKey]: memberId,
    }));
  }

  function apply(): void {
    if (survivorId === null || members === null) return;
    merge.mutate({
      survivorId,
      loserIds: memberIds.filter(id => id !== survivorId),
      fieldChoices: buildFieldChoices(units, unitChoices, survivorId),
    }, {
      onSuccess: () => {
        notifySuccess(t("Merged {{count}} bookmarks.", {
          count: memberIds.length,
        }));
        onClose();
      },
      onError: error => notifyError(error.message),
    });
  }

  return {
    members,
    isLoading: group !== null && members === null,
    survivorId,
    setSurvivorId,
    units,
    unitChoices,
    chooseUnit,
    summary,
    resolveCategoryName,
    apply,
    applying: merge.isPending,
  };
}
