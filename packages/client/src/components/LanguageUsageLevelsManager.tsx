import type { LanguageUsageKind, LanguageUsageLevel } from "@eesimple/types";

import { useState } from "react";

import { Lock, Plus, Trash2 } from "lucide-react";

import {
  useCreateLanguageUsageLevel,
  useDeleteLanguageUsageLevel,
  useLanguageUsageLevels,
  useUpdateLanguageUsageLevel,
} from "../hooks/useLanguageUsageLevels";
import { describeError } from "../lib/apiError";
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
    data: levels = [],
  } = useLanguageUsageLevels();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Language Usage Levels</h1>
        <p className="text-sm text-muted-foreground">
          The vocabulary used when associating a language with a bookmark, movie, show, website,
          channel, or person.
        </p>
      </div>
      {GROUPS.map(group => (
        <LevelGroupCard
          key={group.kind}
          kind={group.kind}
          title={group.title}
          description={group.description}
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
          notifySuccess(`Added usage level "${name}"`);
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
          <p className="text-sm text-muted-foreground">No levels yet.</p>
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
            placeholder="New level name…"
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
            Add
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
  const [name, setName] = useState(level.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const update = useUpdateLanguageUsageLevel();

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
        onSuccess: () => notifySuccess(`Renamed to "${trimmed}"`),
        onError: (error) => {
          setName(level.name);
          notifyError(describeError(error));
        },
      },
    );
  }

  return (
    <div className="flex items-center gap-2">
      {level.builtIn
        ? (
          <div className="flex flex-1 items-center gap-2 text-sm">
            <Lock className="size-3.5 text-muted-foreground" />
            {level.name}
          </div>
        )
        : (
          <Input
            className="flex-1"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={saveName}
            aria-label="Level name"
          />
        )}
      <Badge variant="outline">{level.usageCount}</Badge>
      {!level.builtIn && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete level"
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
  const [reassignTo, setReassignTo] = useState<string>("");
  const remove = useDeleteLanguageUsageLevel();

  function confirmDelete() {
    remove.mutate(
      {
        id: level.id,
        reassignTo: reassignTo || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          notifySuccess(`Deleted usage level "${level.name}"`);
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
          <DialogTitle>{`Delete "${level.name}"?`}</DialogTitle>
          <DialogDescription>
            {level.usageCount > 0
              ? `${level.usageCount} association(s) use this level. Reassign them to another level, or delete anyway to remove them.`
              : "This level isn't used by any association."}
          </DialogDescription>
        </DialogHeader>
        {level.usageCount > 0 && siblings.length > 0 && (
          <Select
            value={reassignTo}
            onValueChange={setReassignTo}
          >
            <SelectTrigger aria-label="Reassign to">
              <SelectValue placeholder="Reassign to… (optional)" />
            </SelectTrigger>
            <SelectContent>
              {siblings.map(s => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                >
                  {s.name}
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
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDelete}
            disabled={remove.isPending}
          >
            {reassignTo ? "Reassign & delete" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
