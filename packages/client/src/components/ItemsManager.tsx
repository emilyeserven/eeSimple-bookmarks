import type { Item } from "@app/types";

import { useForm } from "@tanstack/react-form";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateItem, useDeleteItem, useItems, useUpdateItem } from "@/hooks/useItems";
import { describeError } from "@/lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";

const nameSchema = z.string().trim().min(1, "Name is required");

/**
 * Example feature: list, create, auto-save, and delete items. It demonstrates the house patterns —
 * TanStack Query hooks with toasts, a TanStack Form + zod create form, and per-field auto-save on
 * blur (no Save button) reported through `lib/autoSave`. Replace it with your own feature.
 */
export function ItemsManager() {
  const {
    t,
  } = useTranslation();
  const {
    data: items, isLoading,
  } = useItems();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("Items")}</h1>
      <CreateItemForm />
      {isLoading ? <p className="text-muted-foreground">{t("Loading…")}</p> : null}
      {items?.length === 0 ? <p className="text-sm text-muted-foreground">{t("No items yet.")}</p> : null}
      <ul className="space-y-3">
        {items?.map(item => (
          <li key={item.id}>
            <ItemRow item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateItemForm() {
  const {
    t,
  } = useTranslation();
  const create = useCreateItem();
  const form = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({
      value, formApi,
    }) => {
      await create.mutateAsync({
        name: value.name.trim(),
      });
      formApi.reset();
    },
  });
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onSubmit: nameSchema,
        }}
      >
        {field => (
          <Input
            aria-label={t("New item name")}
            placeholder={t("New item name")}
            value={field.state.value}
            onChange={e => field.handleChange(e.target.value)}
            aria-invalid={field.state.meta.errors.length > 0}
          />
        )}
      </form.Field>
      <Button
        type="submit"
        disabled={create.isPending}
      >
        {t("Add")}
      </Button>
    </form>
  );
}

function ItemRow({
  item,
}: { item: Item }) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateItem();
  const remove = useDeleteItem();

  const saveDescription = (value: string) => {
    const description = value.trim() || null;
    if (description === item.description) return; // no-op skip
    update.mutate({
      id: item.id,
      input: {
        description,
      },
    }, {
      onSuccess: () => notifyFieldSaved("Description"),
      onError: err => notifyFieldSaveError("Description", describeError(err)),
    });
  };

  return (
    <RowCard className="space-y-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{item.name}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("Delete {{name}}", {
            name: item.name,
          })}
          onClick={() => remove.mutate(item.id)}
        >
          <Trash2 />
        </Button>
      </div>
      <Textarea
        aria-label={t("Description")}
        placeholder={t("Description")}
        defaultValue={item.description ?? ""}
        onBlur={e => saveDescription(e.target.value)}
      />
    </RowCard>
  );
}
