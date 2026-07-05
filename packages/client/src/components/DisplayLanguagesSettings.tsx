import { useTranslation } from "react-i18next";

import { useLanguages, useUpdateLanguage } from "../hooks/useLanguages";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * Pick Favorite languages — favorited languages sort towards the top of every language picker
 * app-wide (see `languageOptions.ts`). Each row auto-saves on toggle, like every other edit-tab
 * field (no Save button).
 */
export function DisplayLanguagesSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data: languages = [],
  } = useLanguages();
  const updateLanguage = useUpdateLanguage();

  function toggleFavorite(id: string, name: string, isFavorite: boolean) {
    updateLanguage.mutate({
      id,
      input: {
        isFavorite,
      },
    }, {
      onSuccess: () => notifyFieldSaved(t("Favorite ({{name}})", {
        name,
      })),
      onError: error => notifyFieldSaveError(
        t("Favorite ({{name}})", {
          name,
        }),
        describeError(error),
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t("Languages")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("Mark Favorite languages to show them towards the top of language pickers.")}
        </p>
      </div>
      <div className="space-y-2">
        {languages.map(language => (
          <div
            key={language.id}
            className="flex items-center gap-2"
          >
            <Checkbox
              id={`favorite-language-${language.id}`}
              checked={language.isFavorite}
              onCheckedChange={checked =>
                toggleFavorite(language.id, language.name, checked === true)}
            />
            <Label htmlFor={`favorite-language-${language.id}`}>{language.name}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
