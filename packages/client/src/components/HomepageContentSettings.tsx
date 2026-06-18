import type { HomepageContentSettings as HomepageContent, HomepageContentWidth, QuickAddDisplay } from "@eesimple/types";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { LabeledSection } from "./LabeledSection";
import {
  useHomepageContentSettings,
  useUpdateHomepageContentSettings,
} from "../hooks/useAppSettings";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const DEFAULTS: HomepageContent = {
  homepageText: "",
  homepageTextWidth: "full",
  bookmarkQuickAddEnabled: false,
  bookmarkQuickAddWidth: "full",
  bookmarkQuickAddDisplay: "collapsible",
};

/**
 * The homepage content block, shown above the homepage sections settings. Configures the Markdown
 * shown at the top of the homepage and whether/how the Bookmark Quick Add form appears.
 */
export function HomepageContentSettings() {
  const {
    data, isLoading,
  } = useHomepageContentSettings();
  const update = useUpdateHomepageContentSettings();
  const [form, setForm] = useState<HomepageContent>(DEFAULTS);

  // Seed local form state once the saved settings load (and whenever they change server-side).
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function save(): void {
    update.mutate(form, {
      onSuccess: () => toast.success("Homepage content saved"),
      onError: error => toast.error(error.message),
    });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <LabeledSection
        title="Homepage Text"
        description="Markdown shown at the very top of your homepage. Leave empty to hide it."
      >
        <RichTextEditor
          value={form.homepageText}
          onChange={markdown => setForm(prev => ({
            ...prev,
            homepageText: markdown,
          }))}
        />
        <WidthToggle
          label="Desktop width"
          value={form.homepageTextWidth}
          onChange={width => setForm(prev => ({
            ...prev,
            homepageTextWidth: width,
          }))}
        />
      </LabeledSection>

      <Separator />

      <LabeledSection
        title="Bookmark Quick Add"
        description="Show the Add Bookmark form on the homepage, below the homepage text."
      >
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.bookmarkQuickAddEnabled}
            onCheckedChange={checked => setForm(prev => ({
              ...prev,
              bookmarkQuickAddEnabled: checked === true,
            }))}
          />
          Enable Bookmark Quick Add
        </label>

        {form.bookmarkQuickAddEnabled
          ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <WidthToggle
                label="Desktop width"
                value={form.bookmarkQuickAddWidth}
                onChange={width => setForm(prev => ({
                  ...prev,
                  bookmarkQuickAddWidth: width,
                }))}
              />
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Display</Label>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={form.bookmarkQuickAddDisplay}
                  onValueChange={(value) => {
                    if (value) {
                      setForm(prev => ({
                        ...prev,
                        bookmarkQuickAddDisplay: value as QuickAddDisplay,
                      }));
                    }
                  }}
                >
                  <ToggleGroupItem value="collapsible">Collapsible</ToggleGroupItem>
                  <ToggleGroupItem value="expanded">Expanded</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          )
          : null}
      </LabeledSection>

      <div>
        <Button
          type="button"
          onClick={save}
          disabled={update.isPending}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

interface WidthToggleProps {
  label: string;
  value: HomepageContentWidth;
  onChange: (width: HomepageContentWidth) => void;
}

/** Full/half desktop-width toggle, shared by the homepage text and Quick Add sections. */
function WidthToggle({
  label, value, onChange,
}: WidthToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <ToggleGroup
        type="single"
        size="sm"
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next as HomepageContentWidth);
        }}
      >
        <ToggleGroupItem value="full">Full</ToggleGroupItem>
        <ToggleGroupItem value="half">Half</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
