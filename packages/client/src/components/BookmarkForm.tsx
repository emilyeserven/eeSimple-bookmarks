import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { TagPicker } from "./TagPicker";
import { useCreateBookmark } from "../hooks/useBookmarks";
import { useTagTree } from "../hooks/useTags";

const bookmarkSchema = z.object({
  url: z.string().url("Enter a valid URL"),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  tagIds: z.array(z.string()),
  favorite: z.boolean(),
});

const fieldClass
  = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

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
      });
      form.reset();
    },
  });

  return (
    <form
      className="
        grid gap-4 rounded-lg border border-slate-200 bg-white p-4
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
          <div className="block text-sm font-medium text-slate-700">
            Tags
            <div className="mt-1 rounded-md border border-slate-300 p-2">
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
          <label
            className="
              flex items-center gap-2 self-end text-sm font-medium
              text-slate-700
            "
          >
            <input
              type="checkbox"
              checked={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.checked)}
            />
            Favorite
          </label>
        )}
      </form.Field>

      <form.Field name="description">
        {field => (
          <label
            className="
              block text-sm font-medium text-slate-700
              sm:col-span-2
            "
          >
            Description
            <textarea
              className={fieldClass}
              rows={2}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
            />
          </label>
        )}
      </form.Field>

      <div className="sm:col-span-2">
        <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit}
              className="
                rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
                hover:bg-blue-700
                disabled:opacity-50
              "
            >
              {isSubmitting ? "Saving…" : "Add bookmark"}
            </button>
          )}
        </form.Subscribe>
        {createBookmark.isError ? <p className="mt-2 text-sm text-red-600">{createBookmark.error?.message}</p> : null}
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

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        className={fieldClass}
        value={value}
        onBlur={onBlur}
        onChange={event => onChange(event.target.value)}
      />
      {messages.length > 0 ? <span className="mt-1 block text-xs text-red-600">{messages.join(", ")}</span> : null}
    </label>
  );
}
