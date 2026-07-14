import type { Language, UpdateLanguageInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateLanguage } from "../hooks/useLanguages";
import { useAppForm } from "../lib/form";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const isoCodeSchema = z.object({
  isoCode: z.string(),
});

const descriptionSchema = z.object({
  description: z.string(),
});

const NAME_LABELS: Partial<Record<keyof UpdateLanguageInput, string>> = {
  name: "Name",
};

const ISO_CODE_LABELS: Partial<Record<keyof UpdateLanguageInput, string>> = {
  isoCode: "ISO code",
};

const DESCRIPTION_LABELS: Partial<Record<keyof UpdateLanguageInput, string>> = {
  description: "Description",
};

interface LanguageFieldProps {
  language: Language;
}

/**
 * The language's name. A standalone placeable field (the `name` field in the registry); it mounts its
 * own `useAppForm` + `useFieldAutoSave` (no cross-field coordination — the Category #1186 precedent).
 * Auto-saves on blur and follows the new slug. Built-in languages can't be renamed.
 */
export function LanguageNameEditField({
  language,
}: LanguageFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const update = useUpdateLanguage();
  const autoSave = useFieldAutoSave<UpdateLanguageInput, Language>({
    id: language.id,
    update,
    labels: NAME_LABELS,
    initial: {
      name: language.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: language.name,
    },
    validators: {
      onChange: nameSchema,
    },
  });

  return (
    <div className="space-y-1">
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
    </div>
  );
}

/** The language's ISO 639-1 code. A standalone placeable field; saves on blur. */
export function LanguageIsoCodeEditField({
  language,
}: LanguageFieldProps) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateLanguage();
  const autoSave = useFieldAutoSave<UpdateLanguageInput, Language>({
    id: language.id,
    update,
    labels: ISO_CODE_LABELS,
    initial: {
      isoCode: language.isoCode ?? "",
    },
  });

  const form = useAppForm({
    defaultValues: {
      isoCode: language.isoCode ?? "",
    },
    validators: {
      onChange: isoCodeSchema,
    },
  });

  return (
    <div className="space-y-1">
      <form.AppField name="isoCode">
        {field => (
          <field.TextField
            label={t("ISO code")}
            placeholder={t("e.g. en")}
            onBlur={() => autoSave.saveField("isoCode", field.state.value.trim())}
            debounceSave
          />
        )}
      </form.AppField>
      <p className="text-xs text-muted-foreground">
        {t("ISO 639-1 code, used to match autofetched languages from scans and ISBN lookups.")}
      </p>
    </div>
  );
}

/** The language's description. A standalone placeable field; saves on blur. */
export function LanguageDescriptionEditField({
  language,
}: LanguageFieldProps) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateLanguage();
  const autoSave = useFieldAutoSave<UpdateLanguageInput, Language>({
    id: language.id,
    update,
    labels: DESCRIPTION_LABELS,
    initial: {
      description: language.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: language.description ?? "",
    },
    validators: {
      onChange: descriptionSchema,
    },
  });

  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label={t("Description")}
          debounceSave
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
  );
}
