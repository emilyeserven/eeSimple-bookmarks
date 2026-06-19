import type { YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/hooks/useCategories";
import { useUpdateYouTubeChannel } from "@/hooks/useYouTubeChannels";
import { useAppForm } from "@/lib/form";
import { CategoryIcon } from "@/lib/icons";

const channelGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  categoryId: z.string().nullable(),
});

interface Props {
  channel: YouTubeChannel;
}

/** Edit a YouTube channel's display name, category, and self-identifiers. */
export function YouTubeChannelGeneralForm({
  channel,
}: Props) {
  const updateChannel = useUpdateYouTubeChannel();
  const [selfIds, setSelfIds] = useState<string[]>(channel.selfIds);
  const [newSelfId, setNewSelfId] = useState("");
  const {
    data: categories,
  } = useCategories();

  const form = useAppForm({
    defaultValues: {
      name: channel.name,
      categoryId: channel.category?.id ?? null,
    },
    validators: {
      onChange: channelGeneralSchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateChannel.mutate({
        id: channel.id,
        input: {
          name: value.name.trim(),
          selfIds,
          categoryId: value.categoryId || null,
        },
      });
    },
  });

  function addSelfId(): void {
    const trimmed = newSelfId.trim();
    if (!trimmed || selfIds.includes(trimmed)) {
      setNewSelfId("");
      return;
    }
    setSelfIds(prev => [...prev, trimmed]);
    setNewSelfId("");
  }

  function removeSelfId(value: string): void {
    setSelfIds(prev => prev.filter(id => id !== value));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {field => (
          <field.TextField label="Channel name" />
        )}
      </form.AppField>

      <form.AppField name="categoryId">
        {field => (
          <field.ComboboxField
            label="Category"
            placeholder="No category"
            searchPlaceholder="Search categories…"
            emptyText="No categories found."
            options={(categories ?? []).map(category => ({
              value: category.id,
              label: category.name,
              icon: (
                <CategoryIcon
                  name={category.icon}
                  className="size-4 shrink-0"
                />
              ),
            }))}
          />
        )}
      </form.AppField>

      <Separator />

      <div className="space-y-2">
        <Label className="block">Self-identifiers</Label>
        <p className="text-sm text-muted-foreground">
          Short names this channel appends to video titles (e.g. &quot;SNL&quot;). Stripped automatically when a bookmark title is fetched.
        </p>
        {selfIds.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selfIds.map(id => (
              <Badge
                key={id}
                variant="secondary"
                className="cursor-pointer gap-1"
                onClick={() => removeSelfId(id)}
                title={`Remove "${id}"`}
              >
                {id}
                <span aria-hidden>×</span>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newSelfId}
            onChange={e => setNewSelfId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSelfId();
              }
            }}
            placeholder="e.g. SNL"
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addSelfId}
            disabled={!newSelfId.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      <form.AppForm>
        <form.Subscribe selector={state => state.values}>
          {(values) => {
            const nameDirty = values.name.trim() !== channel.name;
            const selfIdsDirty = JSON.stringify(selfIds) !== JSON.stringify(channel.selfIds);
            const categoryIdDirty = (values.categoryId || null) !== (channel.category?.id ?? null);
            return (
              <form.SubmitButton
                label="Save changes"
                size="sm"
                disabledWhen={!nameDirty && !selfIdsDirty && !categoryIdDirty}
              />
            );
          }}
        </form.Subscribe>
      </form.AppForm>
    </form>
  );
}
