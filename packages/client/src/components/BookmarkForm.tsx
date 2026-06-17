import { useForm } from "@tanstack/react-form";
import { ChevronDown } from "lucide-react";
import { z } from "zod";

import { TagPicker } from "./TagPicker";
import { useCreateBookmark } from "../hooks/useBookmarks";
import { useTagTree } from "../hooks/useTags";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const bookmarkSchema = z.object({
  url: z.string().url("Enter a valid URL"),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  tagIds: z.array(z.string()),
  favorite: z.boolean(),
  pinned: z.boolean(),
  priority: z.number().int(),
});

/** Create-bookmark form. Owns its own mutation so the page stays focused on the list. */
export function BookmarkForm() {
  const createBookmark = useCreateBookmark();
  const {
    data: tagTree,
  } = useTagTree();

  const form = useForm({
    defaultValues: {
      url: "",
      title: "",
      description: "",
      tagIds: [] as string[],
      favorite: false,
      pinned: false,
      priority: 0,
    },
    validators: {
      onChange: bookmarkSchema,
    },
    onSubmit: async ({
      value,
    }) => {
      await createBookmark.mutateAsync({
        url: value.url,
        title: value.title,
        description: value.description || null,
        tagIds: value.tagIds,
        favorite: value.favorite,
        pinned: value.pinned,
        priority: value.priority,
      });
      form.reset();
    },
  });

  return (
    <form
      className="
        grid gap-4 rounded-lg border bg-card p-4
        sm:grid-cols-2
      "
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="url">
        {field => (
          <TextField
            label="URL"
            type="url"
            value={field.state.value}
            errors={field.state.meta.errors}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
          />
        )}
      </form.Field>

      <form.Field name="title">
        {field => (
          <TextField
            label="Title"
            value={field.state.value}
            errors={field.state.meta.errors}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
          />
        )}
      </form.Field>

      <form.Field name="tagIds">
        {field => (
          <div className="space-y-1">
            <Label>Tags</Label>
            <div className="rounded-md border p-2">
              <TagPicker
                tree={tagTree ?? []}
                selectedIds={field.state.value}
                onToggle={(id) => {
                  const current = field.state.value;
                  field.handleChange(
                    current.includes(id)
                      ? current.filter(tagId => tagId !== id)
                      : [...current, id],
                  );
                }}
              />
            </div>
          </div>
        )}
      </form.Field>

      <form.Field name="favorite">
        {field => (
          <div className="flex items-center gap-2 self-end">
            <Checkbox
              id="bookmark-favorite"
              checked={field.state.value}
              onBlur={field.handleBlur}
              onCheckedChange={checked => field.handleChange(checked === true)}
            />
            <Label htmlFor="bookmark-favorite">Favorite</Label>
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {field => (
          <div
            className="
              space-y-1
              sm:col-span-2
            "
          >
            <Label htmlFor="bookmark-description">Description</Label>
            <Textarea
              id="bookmark-description"
              rows={2}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
            />
          </div>
        )}
      </form.Field>

      <Collapsible
        className="
          group/advanced space-y-3
          sm:col-span-2
        "
      >
        <CollapsibleTrigger
          className="
            flex items-center gap-1 text-sm font-medium text-muted-foreground
            hover:text-foreground
          "
        >
          <ChevronDown
            className="
              size-4 transition-transform
              group-data-[state=open]/advanced:rotate-180
            "
          />
          Advanced
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3">
          <form.Field name="pinned">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bookmark-pinned"
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor="bookmark-pinned">Pin to Homepage</Label>
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={state => state.values.pinned}>
            {pinned =>
              pinned
                ? (
                  <form.Field name="priority">
                    {field => (
                      <div className="space-y-1">
                        <Label htmlFor="bookmark-priority">Priority</Label>
                        <Input
                          id="bookmark-priority"
                          type="number"
                          className="max-w-32"
                          value={Number.isNaN(field.state.value) ? "" : field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            const next = event.target.valueAsNumber;
                            field.handleChange(Number.isNaN(next) ? 0 : next);
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher numbers appear first on the homepage.
                        </p>
                      </div>
                    )}
                  </form.Field>
                )
                : null}
          </form.Subscribe>
        </CollapsibleContent>
      </Collapsible>

      <div className="sm:col-span-2">
        <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
            >
              {isSubmitting ? "Saving…" : "Add bookmark"}
            </Button>
          )}
        </form.Subscribe>
        {createBookmark.isError ? <p className="mt-2 text-sm text-destructive">{createBookmark.error?.message}</p> : null}
      </div>
    </form>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  errors: unknown[];
  type?: string;
  onBlur: () => void;
  onChange: (value: string) => void;
}

function TextField({
  label, value, errors, type = "text", onBlur, onChange,
}: TextFieldProps) {
  const messages = errors
    .map(error => (typeof error === "string" ? error : (error as { message?: string })?.message))
    .filter(Boolean);
  const id = `bookmark-${label.toLowerCase()}`;

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onBlur={onBlur}
        onChange={event => onChange(event.target.value)}
      />
      {messages.length > 0 ? <span className="block text-xs text-destructive">{messages.join(", ")}</span> : null}
    </div>
  );
}
