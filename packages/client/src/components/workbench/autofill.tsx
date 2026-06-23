/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { AutofillRule } from "@eesimple/types";

import { useMemo, useState } from "react";

import { Copy } from "lucide-react";

import { AutofillRuleConditionsForm } from "../AutofillRuleConditionsForm";
import { AutofillConditionsFields, AutofillGeneralFields, AutofillPrefillFields } from "../AutofillRuleDetail";
import { AutofillRuleGeneralForm } from "../AutofillRuleGeneralForm";
import { AutofillRulePrefillForm } from "../AutofillRulePrefillForm";
import { Combobox } from "../Combobox";
import { CopyJsonButton } from "../CopyJsonButton";

import { Button } from "@/components/ui/button";
import { useAutofillRuleById, useAutofillRuleBySlug, useDeleteAutofillRule } from "@/hooks/useAutofill";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useMediaTypes } from "@/hooks/useMediaTypes";
import { useTags } from "@/hooks/useTags";
import { notifyError, notifySuccess } from "@/lib/notifications";

function ConditionsView({
  entity: rule,
}: {
  entity: AutofillRule;
}) {
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: tags = [],
  } = useTags();
  const {
    data: properties = [],
  } = useCustomProperties();
  return (
    <AutofillConditionsFields
      rule={rule}
      categories={categories}
      tags={tags}
      properties={properties}
    />
  );
}

function DebugView({
  entity: rule,
}: {
  entity: AutofillRule;
}) {
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | undefined>();
  const {
    data: allBookmarks = [],
  } = useBookmarks();

  const bookmarkOptions = useMemo(
    () => allBookmarks.map(b => ({
      value: b.id,
      label: b.title,
    })),
    [allBookmarks],
  );

  const selectedBookmark = selectedBookmarkId
    ? allBookmarks.find(b => b.id === selectedBookmarkId)
    : undefined;

  async function copyPrompt() {
    const text = [
      "Does the following bookmark match the autofill rule's conditions?",
      "",
      "Rule:",
      "```json",
      JSON.stringify(rule, null, 2),
      "```",
      "",
      "Bookmark:",
      "```json",
      JSON.stringify(selectedBookmark, null, 2),
      "```",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      notifySuccess("Copied to clipboard");
    }
    catch {
      notifyError("Couldn't copy to clipboard");
    }
  }

  return (
    <div className="space-y-4">
      <CopyJsonButton
        data={rule}
        label="Copy Rule JSON"
      />
      <div className="space-y-2">
        <Combobox
          options={bookmarkOptions}
          value={selectedBookmarkId}
          onValueChange={v => setSelectedBookmarkId(v ?? undefined)}
          placeholder="Search bookmarks to include in a debug prompt…"
          searchPlaceholder="Search bookmarks…"
          emptyText="No bookmarks found."
        />
        {selectedBookmark && (
          <div className="flex gap-2">
            <CopyJsonButton
              data={selectedBookmark}
              label="Copy Bookmark JSON"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => void copyPrompt()}
            >
              <Copy className="size-4" />
              Copy Prompt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PrefillView({
  entity: rule,
}: {
  entity: AutofillRule;
}) {
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: mediaTypes = [],
  } = useMediaTypes();
  const {
    data: tags = [],
  } = useTags();
  const {
    data: properties = [],
  } = useCustomProperties();
  return (
    <AutofillPrefillFields
      rule={rule}
      categories={categories}
      mediaTypes={mediaTypes}
      tags={tags}
      properties={properties}
    />
  );
}

/** Single source of truth for an autofill rule's tabbed view/edit UI (main pane routes + right panel). */
export const autofillWorkbench: EntityWorkbench<AutofillRule> = {
  useBySlug: (slug) => {
    const {
      rule, isLoading,
    } = useAutofillRuleBySlug(slug);
    return {
      entity: rule,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      rule, isLoading, error,
    } = useAutofillRuleById(id);
    return {
      entity: rule,
      isLoading,
      error,
    };
  },
  name: rule => rule.name,
  useDelete: () => {
    const mutation = useDeleteAutofillRule();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Autofill rule not found.",
  navAriaLabel: "Autofill rule sections",
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, description, and priority.",
        render: ({
          entity,
        }) => <AutofillGeneralFields rule={entity} />,
      },
      edit: {
        title: "General",
        description: "Name, description, and priority.",
        render: ({
          entity,
        }) => <AutofillRuleGeneralForm rule={entity} />,
      },
    },
    {
      key: "conditions",
      label: "Activation Conditions",
      view: {
        title: "Activation Conditions",
        description: "When this rule fires.",
        render: ConditionsView,
      },
      edit: {
        title: "Activation Conditions",
        description: "Configure when this rule should apply.",
        render: ({
          entity,
        }) => <AutofillRuleConditionsForm rule={entity} />,
      },
    },
    {
      key: "prefill",
      label: "What Gets Prefilled",
      view: {
        title: "What Gets Prefilled",
        description: "Category, tags, and custom-property values set when this rule matches.",
        render: PrefillView,
      },
      edit: {
        title: "What Gets Prefilled",
        description: "Configure the category, tags, and property values this rule sets.",
        render: ({
          entity,
        }) => <AutofillRulePrefillForm rule={entity} />,
      },
    },
    {
      key: "debug",
      label: "Debug",
      view: {
        title: "Debug",
        description: "Rule and bookmark JSON for debugging rule matching with Claude.",
        render: DebugView,
      },
    },
  ],
};
