import type { DuplicateGroup, DuplicateGroupKind, DuplicateGroupMember } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MergeBookmarksDialog } from "./MergeBookmarksDialog";
import { useDuplicateGroups } from "../hooks/useDuplicates";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const KIND_LABELS = {
  "same-url": "Same URL",
  "same-page": "Same page",
  "shared-identity": "Shared identity",
  "same-title": "Same title",
} as const satisfies Record<DuplicateGroupKind, string>;

function MemberRow({
  member,
}: {
  member: DuplicateGroupMember;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <Link
          to="/bookmarks/$bookmarkId"
          params={{
            bookmarkId: member.id,
          }}
          className="
            text-sm font-medium
            hover:underline
          "
        >
          {member.title}
        </Link>
        {member.url
          ? <p className="truncate text-xs text-muted-foreground">{member.url}</p>
          : null}
      </div>
      <p className="shrink-0 text-xs text-muted-foreground">
        {t("Added {{when}}", {
          when: new Date(member.createdAt).toLocaleDateString(),
        })}
      </p>
    </li>
  );
}

function GroupCard({
  group,
  onMerge,
}: {
  group: DuplicateGroup;
  onMerge: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant={group.kind === "same-title" ? "outline" : "secondary"}>
              {t(KIND_LABELS[group.kind])}
            </Badge>
            <CardDescription>
              {t("{{count}} bookmarks", {
                count: group.members.length,
              })}
            </CardDescription>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onMerge}
        >
          {t("Merge…")}
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y">
          {group.members.map(member => (
            <MemberRow
              key={member.id}
              member={member}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Settings → Advanced → Duplicates: the scan results, tiered by confidence, with per-group merge. */
export function DuplicatesSettingsCard() {
  const {
    t,
  } = useTranslation();
  const {
    data, isLoading, isFetching, refetch,
  } = useDuplicateGroups();
  const [mergeGroup, setMergeGroup] = useState<DuplicateGroup | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("Loading…")}
      </div>
    );
  }

  const groups = data?.groups ?? [];
  const possibleGroups = data?.possibleGroups ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("Scanned {{count}} bookmarks.", {
            count: data?.scannedCount ?? 0,
          })}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw className="size-4" />
          {t("Rescan")}
        </Button>
      </div>
      {groups.length === 0 && possibleGroups.length === 0
        ? <p className="text-sm text-muted-foreground">{t("No duplicates found.")}</p>
        : null}
      {groups.length > 0
        ? (
          <div className="space-y-4">
            <CardTitle className="text-base">{t("Duplicates")}</CardTitle>
            {groups.map(group => (
              <GroupCard
                key={group.key}
                group={group}
                onMerge={() => setMergeGroup(group)}
              />
            ))}
          </div>
        )
        : null}
      {possibleGroups.length > 0
        ? (
          <div className="space-y-4">
            <div>
              <CardTitle className="text-base">{t("Possible duplicates")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("These bookmarks only share a title — review them before merging.")}
              </p>
            </div>
            {possibleGroups.map(group => (
              <GroupCard
                key={group.key}
                group={group}
                onMerge={() => setMergeGroup(group)}
              />
            ))}
          </div>
        )
        : null}
      <MergeBookmarksDialog
        group={mergeGroup}
        onClose={() => setMergeGroup(null)}
      />
    </div>
  );
}
