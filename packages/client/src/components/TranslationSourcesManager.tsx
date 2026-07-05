import type { TranslationSource } from "@eesimple/types";

import { useState } from "react";

import { Lock, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  useCreateTranslationSource,
  useDeleteTranslationSource,
  useTranslationSources,
  useUpdateTranslationSource,
} from "../hooks/useTranslationSources";
import { describeError } from "../lib/apiError";
import { useBuiltInName } from "../lib/builtInName";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Settings page: manage the user-definable translation sources used on language usages. */
export function TranslationSourcesManager() {
  const {
    t,
  } = useTranslation();
  const {
    data: sources = [],
  } = useTranslationSources();
  const [newName, setNewName] = useState("");
  const create = useCreateTranslationSource();

  function addSource() {
    const name = newName.trim();
    if (name.length === 0) return;
    create.mutate(
      {
        name,
      },
      {
        onSuccess: () => {
          setNewName("");
          notifySuccess(t("Added translation source \"{{name}}\"", {
            name,
          }));
        },
        onError: error => notifyError(describeError(error)),
      },
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">{t("Translation Sources")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("How a language's translation or script was produced — attached, optionally, when associating a language with a bookmark, movie, show, website, channel, or person.")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("Translation Sources")}</CardTitle>
          <CardDescription>
            {t("e.g. AI generated, Fan-translated, Professionally translated.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sources.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("No translation sources yet.")}</p>
          )}
          {sources.map(source => (
            <SourceRow
              key={source.id}
              source={source}
              siblings={sources}
            />
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder={t("New source name…")}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSource();
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={addSource}
              disabled={newName.trim().length === 0 || create.isPending}
            >
              <Plus className="size-4" />
              {t("Add")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface RowProps {
  source: TranslationSource;
  siblings: TranslationSource[];
}

function SourceRow({
  source, siblings,
}: RowProps) {
  const {
    t,
  } = useTranslation();
  const [name, setName] = useState(source.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const update = useUpdateTranslationSource();
  const builtInName = useBuiltInName();

  function saveName() {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed === source.name) {
      setName(source.name);
      return;
    }
    update.mutate(
      {
        id: source.id,
        input: {
          name: trimmed,
        },
      },
      {
        onSuccess: () => notifySuccess(t("Renamed to \"{{name}}\"", {
          name: trimmed,
        })),
        onError: (error) => {
          setName(source.name);
          notifyError(describeError(error));
        },
      },
    );
  }

  return (
    <div className="flex items-center gap-2">
      {source.builtIn
        ? (
          <div className="flex flex-1 items-center gap-2 text-sm">
            <Lock className="size-3.5 text-muted-foreground" />
            {builtInName(source)}
          </div>
        )
        : (
          <Input
            className="flex-1"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={saveName}
            aria-label={t("Source name")}
          />
        )}
      <Badge variant="outline">{source.usageCount}</Badge>
      {!source.builtIn && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Delete source")}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
      <DeleteSourceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        source={source}
        siblings={siblings.filter(s => s.id !== source.id)}
      />
    </div>
  );
}

interface DeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: TranslationSource;
  siblings: TranslationSource[];
}

function DeleteSourceDialog({
  open, onOpenChange, source, siblings,
}: DeleteProps) {
  const {
    t,
  } = useTranslation();
  const [reassignTo, setReassignTo] = useState<string>("");
  const remove = useDeleteTranslationSource();
  const builtInName = useBuiltInName();

  function confirmDelete() {
    remove.mutate(
      {
        id: source.id,
        reassignTo: reassignTo || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          notifySuccess(t("Deleted translation source \"{{name}}\"", {
            name: source.name,
          }));
        },
        onError: error => notifyError(describeError(error)),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Delete \"{{name}}\"?", {
            name: source.name,
          })}
          </DialogTitle>
          <DialogDescription>
            {source.usageCount > 0
              ? t("{{count}} association(s) use this source. Reassign them to another source, or delete to clear the source from them (the languages themselves are kept).", {
                count: source.usageCount,
              })
              : t("This source isn't used by any association.")}
          </DialogDescription>
        </DialogHeader>
        {source.usageCount > 0 && siblings.length > 0 && (
          <Select
            value={reassignTo}
            onValueChange={setReassignTo}
          >
            <SelectTrigger aria-label={t("Reassign to")}>
              <SelectValue placeholder={t("Reassign to… (optional)")} />
            </SelectTrigger>
            <SelectContent>
              {siblings.map(s => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                >
                  {builtInName(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDelete}
            disabled={remove.isPending}
          >
            {reassignTo ? t("Reassign & delete") : t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
