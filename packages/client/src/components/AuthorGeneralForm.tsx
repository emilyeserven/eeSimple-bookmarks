import type { Author, UpdateAuthorInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { UserCircle, Sparkles } from "lucide-react";
import { z } from "zod";

import { EntityImageField } from "./EntityImageField";
import { useAutoAuthorImage, useDeleteAuthorImage, useUpdateAuthor, useUploadAuthorImage } from "../hooks/useAuthors";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

import { Button } from "@/components/ui/button";

const authorGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  authorWebsiteUrl: z.string(),
  biographyUrl: z.string(),
});

const LABELS: Partial<Record<keyof UpdateAuthorInput, string>> = {
  name: "Name",
  authorWebsiteUrl: "Author website",
  biographyUrl: "Biography URL",
};

interface Props {
  author: Author;
}

/** Edit an author's name, URLs, and avatar. Fields auto-save on blur (no Save button). */
export function AuthorGeneralForm({
  author,
}: Props) {
  const navigate = useNavigate();
  const update = useUpdateAuthor();
  const uploadAvatar = useUploadAuthorImage();
  const autoAvatar = useAutoAuthorImage();
  const deleteAvatar = useDeleteAuthorImage();
  const avatarBusy = uploadAvatar.isPending || autoAvatar.isPending || deleteAvatar.isPending;

  const autoSave = useFieldAutoSave<UpdateAuthorInput, Author>({
    id: author.id,
    update,
    labels: LABELS,
    initial: {
      name: author.name,
      authorWebsiteUrl: author.authorWebsiteUrl,
      biographyUrl: author.biographyUrl,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: author.name,
      authorWebsiteUrl: author.authorWebsiteUrl ?? "",
      biographyUrl: author.biographyUrl ?? "",
    },
    validators: {
      onChange: authorGeneralSchema,
    },
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Name"
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== author.slug) {
                    void navigate({
                      to: "/taxonomies/authors/$authorSlug/edit/general",
                      params: {
                        authorSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            )}
          />
        )}
      </form.AppField>

      <form.AppField name="authorWebsiteUrl">
        {field => (
          <field.TextField
            label="Author website URL"
            type="url"
            placeholder="https://example.com"
            onBlur={() => autoSave.saveField(
              "authorWebsiteUrl",
              field.state.value.trim() || null,
            )}
          />
        )}
      </form.AppField>

      <form.AppField name="biographyUrl">
        {field => (
          <field.TextField
            label="Biography URL"
            type="url"
            placeholder="https://example.com/bio"
            onBlur={() => autoSave.saveField(
              "biographyUrl",
              field.state.value.trim() || null,
            )}
          />
        )}
      </form.AppField>

      <EntityImageField
        label="Avatar"
        imageUrl={author.imageUrl}
        shape="circle"
        fallback={<UserCircle className="size-5" />}
        busy={avatarBusy}
        onUpload={file => uploadAvatar.mutate({
          id: author.id,
          file,
        })}
        onRemove={() => deleteAvatar.mutate(author.id)}
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={avatarBusy || !author.authorWebsiteUrl}
          onClick={() => autoAvatar.mutate({
            id: author.id,
            source: "website",
            sourceUrl: author.authorWebsiteUrl ?? undefined,
          })}
        >
          <Sparkles className="size-4" />
          Fetch from Author Website
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={avatarBusy || !author.biographyUrl}
          onClick={() => autoAvatar.mutate({
            id: author.id,
            source: "biography",
            sourceUrl: author.biographyUrl ?? undefined,
          })}
        >
          <Sparkles className="size-4" />
          Fetch from Biography
        </Button>
      </div>
    </div>
  );
}
