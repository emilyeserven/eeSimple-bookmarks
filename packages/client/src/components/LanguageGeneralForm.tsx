import type { Language, UpdateLanguageInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateLanguage } from "../hooks/useLanguages";
import { useAppForm } from "../lib/form";

const languageGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  isoCode: z.string(),
  description: z.string(),
});

interface Props {
  language: Language;
}

/**
 * Edit a language's name and ISO code. Each field auto-saves (no Save button): both persist on
 * blur. Built-in languages can't be renamed.
 */
export function LanguageGeneralForm({
  language,
}: Props) {
  const {
    t,
  } = useTranslation();
  const LABELS: Partial<Record<keyof UpdateLanguageInput, string>> = {
    name: t("Name"),
    isoCode: t("ISO code"),
    description: t("Description"),
  };
  const navigate = useNavigate();
  const update = useUpdateLanguage();
  const autoSave = useFieldAutoSave<UpdateLanguageInput, Language>({
    id: language.id,
    update,
    labels: LABELS,
    initial: {
      name: language.name,
      isoCode: language.isoCode ?? "",
      description: language.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: language.name,
      isoCode: language.isoCode ?? "",
      description: language.description ?? "",
    },
    validators: {
      onChange: languageGeneralSchema,
    },
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            disabled={language.builtIn}
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== language.slug) {
                    void navigate({
                      to: "/taxonomies/languages/$languageSlug/edit",
                      params: {
                        languageSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            )}
          />
        )}
      </form.AppField>
      {language.builtIn
        ? <p className="text-xs text-muted-foreground">{t("Built-in languages can't be renamed.")}</p>
        : null}

      <form.AppField name="isoCode">
        {field => (
          <field.TextField
            label={t("ISO code")}
            placeholder={t("e.g. en")}
            onBlur={() => autoSave.saveField("isoCode", field.state.value.trim())}
          />
        )}
      </form.AppField>
      <p className="text-xs text-muted-foreground">
        {t("ISO 639-1 code, used to match autofetched languages from scans and ISBN lookups.")}
      </p>

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
            onBlur={() => autoSave.saveField(
              "description",
              field.state.value.trim() || null,
              {
                valid: field.state.meta.errors.length === 0,
              },
            )}
          />
        )}
      </form.AppField>

      <GenreMoodAssignmentSection
        ownerType="language"
        ownerId={language.id}
      />
    </div>
  );
}
