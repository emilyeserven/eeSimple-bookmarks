import type { Taxonomy } from "@eesimple/types";

import { useState } from "react";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import {
  useCreateTaxonomy,
  useCreateTaxonomyTerm,
  useDeleteTaxonomy,
  useDeleteTaxonomyTerm,
  useDemoteTaxonomy,
  useTaxonomies,
  useTaxonomyTermTree,
  useUpdateTaxonomy,
} from "../hooks/useTaxonomies";
import { notifyError, notifySuccess } from "../lib/notifications";
import { flattenTree } from "../lib/tagTree";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Add/remove the terms of one taxonomy (flat list; a parent picker nests under a hierarchical one). */
function TaxonomyTermsEditor({
  taxonomy,
}: { taxonomy: Taxonomy }) {
  const {
    t,
  } = useTranslation();
  const {
    data: tree = [],
  } = useTaxonomyTermTree(taxonomy.id);
  const createTerm = useCreateTaxonomyTerm(taxonomy.id);
  const deleteTerm = useDeleteTaxonomyTerm(taxonomy.id);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const flat = flattenTree(tree);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createTerm.mutate({
      name: trimmed,
      parentId: parentId ?? null,
    }, {
      onSuccess: () => {
        setName("");
        notifySuccess(t("Term added"));
      },
      onError: () => notifyError(t("Couldn't add term")),
    });
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground">{t("Terms")}</p>
      {flat.length === 0
        ? <p className="text-xs text-muted-foreground">{t("No terms yet.")}</p>
        : (
          <ul className="space-y-1">
            {flat.map(({
              node, depth,
            }) => (
              <li
                key={node.id}
                className="flex items-center justify-between gap-2 text-sm"
                style={{
                  paddingLeft: depth * 16,
                }}
              >
                <span>{node.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("Delete term")}
                  onClick={() => deleteTerm.mutate(node.id, {
                    onSuccess: () => notifySuccess(t("Term deleted")),
                  })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      <div className="flex flex-wrap items-end gap-2">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t("New term name")}
          className="max-w-48"
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        {taxonomy.hierarchical && flat.length > 0 && (
          <Combobox
            placeholder={t("Parent (optional)")}
            options={flat.map(({
              node, depth,
            }) => ({
              value: node.id,
              label: node.name,
              depth,
            }))}
            value={parentId}
            onValueChange={setParentId}
          />
        )}
        <Button
          onClick={add}
          disabled={createTerm.isPending}
        >
          {t("Add")}
        </Button>
      </div>
    </div>
  );
}

/** One taxonomy row: config toggles, term editor, hide/demote/delete. */
function TaxonomyManagerRow({
  taxonomy,
}: { taxonomy: Taxonomy }) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateTaxonomy();
  const remove = useDeleteTaxonomy();
  const demote = useDemoteTaxonomy();
  const [expanded, setExpanded] = useState(false);

  const patch = (input: Parameters<typeof update.mutate>[0]["input"], label: string) => {
    update.mutate({
      id: taxonomy.id,
      input,
    }, {
      onSuccess: () => notifySuccess(t("{{label}} saved", {
        label,
      })),
      onError: (err: Error) => notifyError(err.message),
    });
  };

  return (
    <RowCard className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{taxonomy.name}</span>
          {taxonomy.builtIn && <Badge variant="secondary">{t("Built-in")}</Badge>}
          {taxonomy.hidden && <Badge variant="outline">{t("Hidden")}</Badge>}
          <Badge variant="outline">{taxonomy.hierarchical ? t("Hierarchical") : t("Flat")}</Badge>
          <Badge variant="outline">{taxonomy.singleValue ? t("Single") : t("Multiple")}</Badge>
          <span className="text-xs text-muted-foreground">
            {t("{{terms}} terms · {{bookmarks}} bookmarks", {
              terms: taxonomy.termCount ?? 0,
              bookmarks: taxonomy.bookmarkCount ?? 0,
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={taxonomy.hidden ? t("Show") : t("Hide")}
            onClick={() => patch({
              hidden: !taxonomy.hidden,
            }, taxonomy.name)}
          >
            {taxonomy.hidden
              ? <EyeOff className="size-4" />
              : (
                <Eye
                  className="size-4"
                />
              )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => demote.mutate({
              id: taxonomy.id,
            }, {
              onSuccess: () => notifySuccess(t("Demoted to tags")),
              onError: (err: Error) => notifyError(err.message),
            })}
          >
            {t("Demote to tags")}
          </Button>
          {!taxonomy.builtIn && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("Delete taxonomy")}
              onClick={() => remove.mutate(taxonomy.id, {
                onSuccess: () => notifySuccess(t("Taxonomy deleted")),
                onError: (err: Error) => notifyError(err.message),
              })}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={taxonomy.hierarchical}
            onCheckedChange={v => patch({
              hierarchical: Boolean(v),
            }, t("Structure"))}
          />
          {t("Hierarchical")}
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={taxonomy.singleValue}
            onCheckedChange={v => patch({
              singleValue: Boolean(v),
            }, t("Cardinality"))}
          />
          {t("Single value per bookmark")}
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={taxonomy.showInSidebar}
            onCheckedChange={v => patch({
              showInSidebar: Boolean(v),
            }, t("Sidebar"))}
          />
          {t("Show in sidebar")}
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={taxonomy.customLayout ?? false}
            onCheckedChange={v => patch({
              customLayout: Boolean(v),
            }, t("Layout"))}
          />
          {t("Custom page layout")}
        </label>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? t("Hide terms") : t("Edit terms")}
        </Button>
      </div>

      {expanded && <TaxonomyTermsEditor taxonomy={taxonomy} />}
    </RowCard>
  );
}

/** Settings → Taxonomies: create, configure, and manage user-configurable taxonomies + their terms. */
export function TaxonomiesManager() {
  const {
    t,
  } = useTranslation();
  const {
    data: taxonomies = [],
  } = useTaxonomies();
  const create = useCreateTaxonomy();
  const [name, setName] = useState("");
  const [hierarchical, setHierarchical] = useState(true);
  const [singleValue, setSingleValue] = useState(false);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate({
      name: trimmed,
      hierarchical,
      singleValue,
    }, {
      onSuccess: () => {
        setName("");
        notifySuccess(t("Taxonomy created"));
      },
      onError: (err: Error) => notifyError(err.message),
    });
  };

  return (
    <div className="space-y-4">
      <RowCard className="space-y-3 p-4">
        <p className="text-sm font-medium">{t("New taxonomy")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>{t("Name")}</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t("e.g. Format, Series, Rating")}
              className="max-w-56"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={hierarchical}
              onCheckedChange={v => setHierarchical(Boolean(v))}
            />
            {t("Hierarchical")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={singleValue}
              onCheckedChange={v => setSingleValue(Boolean(v))}
            />
            {t("Single value per bookmark")}
          </label>
          <Button
            onClick={add}
            disabled={create.isPending}
          >
            {t("Create")}
          </Button>
        </div>
      </RowCard>

      {taxonomies.map(taxonomy => (
        <TaxonomyManagerRow
          key={taxonomy.id}
          taxonomy={taxonomy}
        />
      ))}
    </div>
  );
}
