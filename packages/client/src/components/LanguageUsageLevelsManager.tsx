import type { LanguageUsageKind, LanguageUsageLevel } from "@eesimple/types";

import { useState } from "react";

import { Eye, EyeOff, Lock, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  useCreateLanguageUsageLevel,
  useDeleteLanguageUsageLevel,
  useLanguageUsageLevels,
  useUpdateLanguageUsageLevel,
} from "../hooks/useLanguageUsageLevels";
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

const GROUPS: { kind: LanguageUsageKind;
  title: string;
  description: string; }[] = [
  {
    kind: "availability",
    title: "Availability",
    description: "How content offers a language — e.g. Dub, Subtitles, Explanations.",
  },
  {
    kind: "proficiency",
    title: "Proficiency",
    description: "A person's command of a language — e.g. Native, Fluent, Learning.",
  },
];

/** Settings page: manage the user-definable language usage levels, grouped by kind. */
export function LanguageUsageLevelsManager() {
  const {
    t,
  } = useTranslation();
  const {
    data: levels = [],
  } = useLanguageUsageLevels();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">{t("Language Usage Levels")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("The vocabulary used when associating a language with a bookmark, movie, show, website, channel, or person.")}
        </p>
      </div>
      {GROUPS.map(group => (
        <LevelGroupCard
          key={group.kind}
          kind={group.kind}
          title={t(group.title)}
          description={t(group.description)}
          levels={levels.filter(l => l.kind === group.kind)}
        />
      ))}
    </div>
  );
}

interface GroupProps {
  kind: LanguageUsageKind;
  title: string;
  description: string;
  levels: LanguageUsageLevel[];
}

function LevelGroupCard({
  kind, title, description, levels,
}: GroupProps) {
  const {
    t,
  } = useTranslation();
  const [newName, setNewName] = useState("");
  const create = useCreateLanguageUsageLevel();

  function addLevel() {
    const name = newName.trim();
    if (name.length === 0) return;
    create.mutate(
      {
        name,
        kind,
      },
      {
        onSuccess: () => {
          setNewName("");
          notifySuccess(t("Added usage level \"{{name}}\"", {
            name,
          }));
        },
        onError: error => notifyError(describeError(error)),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {levels.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("No levels yet.")}</p>
        )}
        {levels.map(level => (
          <LevelRow
            key={level.id}
            level={level}
            siblings={levels}
          />
        ))}
        <div className="flex items-center gap-2 pt-2">
          <Input
            placeholder={t("New level name…")}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addLevel();
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={addLevel}
            disabled={newName.trim().length === 0 || create.isPending}
          >
            <Plus className="size-4" />
            {t("Add")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface RowProps {
  level: LanguageUsageLevel;
  siblings: LanguageUsageLevel[];
}

function LevelRow({
  level, siblings,
}: RowProps) {
  const {
    t,
  } = useTranslation();
  const [name, setName] = useState(level.name);
  const [description, setDescription] = useState(level.description ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const update = useUpdateLanguageUsageLevel();
  const builtInName = useBuiltInName();

  function saveName() {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed === level.name) {
      setName(level.name);
      return;
    }
    update.mutate(
      {
        id: level.id,
        input: {
          name: trimmed,
        },
      },
      {
        onSuccess: () => notifySuccess(t("Renamed to \"{{name}}\"", {
          name: trimmed,
        })),
        onError: (error) => {
          setName(level.name);
          notifyError(describeError(error));
        },
      },
    );
  }

  function saveDescription() {
    const trimmed = description.trim();
    if (trimmed === (level.description ?? "")) return;
    update.mutate(
      {
        id: level.id,
        input: {
          description: trimmed || null,
        },
      },
      {
        onSuccess: () => notifySuccess(t("Updated description for \"{{name}}\"", {
          name: level.name,
        })),
        onError: (error) => {
          setDescription(level.description ?? "");
          notifyError(describeError(error));
        },
      },
    );
  }

  function toggleHidden() {
    const nextHidden = !level.hidden;
    update.mutate(
      {
        id: level.id,
        input: {
          hidden: nextHidden,
        },
      },
      {
        onSuccess: () =>
          notifySuccess(nextHidden
            ? t("Hid \"{{name}}\" from pickers", {
              name: level.name,
            })
            : t("Showing \"{{name}}\" in pickers", {
              name: level.name,
            })),
        onError: error => notifyError(describeError(error)),
      },
    );
  }

  return (
    <div className={level.hidden ? "space-y-1 opacity-60" : "space-y-1"}>
      <div className="flex items-center gap-2">
        {level.builtIn
          ? (
            <div className="flex flex-1 items-center gap-2 text-sm">
              <Lock className="size-3.5 text-muted-foreground" />
              {builtInName(level)}
            </div>
          )
          : (
            <Input
              className="flex-1"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={saveName}
              aria-label={t("Level name")}
            />
          )}
        {level.hidden && <Badge variant="outline">{t("Hidden")}</Badge>}
        <Badge variant="outline">{level.usageCount}</Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={level.hidden
            ? t("Show {{name}}", {
              name: level.name,
            })
            : t("Hide {{name}}", {
              name: level.name,
            })}
          onClick={toggleHidden}
        >
          {level.hidden
            ? <EyeOff className="size-4" />
            : (
              <Eye
                className="size-4"
              />
            )}
        </Button>
        {!level.builtIn && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("Delete level")}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
        <DeleteLevelDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          level={level}
          siblings={siblings.filter(s => s.id !== level.id)}
        />
      </div>
      <Input
        className="text-sm text-muted-foreground"
        placeholder={t("Description (optional)")}
        value={description}
        onChange={e => setDescription(e.target.value)}
        onBlur={saveDescription}
        aria-label={t("Level description")}
      />
    </div>
  );
}

interface DeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: LanguageUsageLevel;
  siblings: LanguageUsageLevel[];
}

function DeleteLevelDialog({
  open, onOpenChange, level, siblings,
}: DeleteProps) {
  const {
    t,
  } = useTranslation();
  const [reassignTo, setReassignTo] = useState<string>("");
  const remove = useDeleteLanguageUsageLevel();
  const builtInName = useBuiltInName();

  function confirmDelete() {
    remove.mutate(
      {
        id: level.id,
        reassignTo: reassignTo || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          notifySuccess(t("Deleted usage level \"{{name}}\"", {
            name: level.name,
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
            name: level.name,
          })}
          </DialogTitle>
          <DialogDescription>
            {level.usageCount > 0
              ? t("{{count}} association(s) use this level. Reassign them to another level, or delete anyway to remove them.", {
                count: level.usageCount,
              })
              : t("This level isn't used by any association.")}
          </DialogDescription>
        </DialogHeader>
        {level.usageCount > 0 && siblings.length > 0 && (
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
