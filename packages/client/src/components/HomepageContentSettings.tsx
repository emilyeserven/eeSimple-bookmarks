import type { HomepageContentSettings as HomepageContent, HomepageContentWidth, QuickAddDisplay } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { LabeledSection } from "./LabeledSection";
import {
  useHomepageContentSettings,
  useUpdateHomepageContentSettings,
} from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";

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
  homepageHeaderHidden: false,
};

/** Debounce window (ms) before an edit auto-saves. */
const AUTOSAVE_DELAY_MS = 800;

/**
 * The homepage content block, shown above the homepage sections settings. Configures the Markdown
 * shown at the top of the homepage and whether/how the Bookmark Quick Add form appears. Edits
 * auto-save after a short debounce (no Save button), firing a recorded success/error toast.
 */
export function HomepageContentSettings() {
  const {
    data, isLoading,
  } = useHomepageContentSettings();
  const update = useUpdateHomepageContentSettings();
  const [form, setForm] = useState<HomepageContent>(DEFAULTS);
  // Mirror the latest form state for the debounced save to read without re-creating the timer.
  const formRef = useRef<HomepageContent>(form);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard: don't auto-save until server data has been loaded at least once.
  const isSeededRef = useRef(false);

  // Seed local form state once the saved settings load (and whenever they change server-side).
  // Writing the ref directly (not via setField) ensures seeding never schedules a save.
  useEffect(() => {
    if (data) {
      isSeededRef.current = true;
      formRef.current = data;
      setForm(data);
    }
  }, [data]);

  // Cancel any pending auto-save when the component unmounts.
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  function scheduleAutoSave(): void {
    if (!isSeededRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      update.mutate(formRef.current, {
        onSuccess: () => notifySuccess("Homepage content saved"),
        onError: error => notifyError(error.message),
      });
    }, AUTOSAVE_DELAY_MS);
  }

  /** Update one field, mirror it into the ref, and debounce an auto-save. */
  function setField<K extends keyof HomepageContent>(key: K, value: HomepageContent[K]): void {
    const next = {
      ...formRef.current,
      [key]: value,
    };
    formRef.current = next;
    setForm(next);
    scheduleAutoSave();
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
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.homepageHeaderHidden}
              onCheckedChange={checked => setField("homepageHeaderHidden", checked === true)}
            />
            Hide default &ldquo;Homepage&rdquo; title and description
          </label>
          <RichTextEditor
            value={form.homepageText}
            onChange={markdown => setField("homepageText", markdown)}
          />
          <WidthToggle
            label="Desktop width"
            value={form.homepageTextWidth}
            onChange={width => setField("homepageTextWidth", width)}
          />
        </div>
      </LabeledSection>

      <Separator />

      <LabeledSection
        title="Bookmark Quick Add"
        description="Show the Add Bookmark form on the homepage, below the homepage text."
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.bookmarkQuickAddEnabled}
              onCheckedChange={checked => setField("bookmarkQuickAddEnabled", checked === true)}
            />
            Enable Bookmark Quick Add
          </label>

          {form.bookmarkQuickAddEnabled
            ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <WidthToggle
                  label="Desktop width"
                  value={form.bookmarkQuickAddWidth}
                  onChange={width => setField("bookmarkQuickAddWidth", width)}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Display</Label>
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={form.bookmarkQuickAddDisplay}
                    onValueChange={(value) => {
                      if (value) setField("bookmarkQuickAddDisplay", value as QuickAddDisplay);
                    }}
                  >
                    <ToggleGroupItem value="collapsible">Collapsible</ToggleGroupItem>
                    <ToggleGroupItem value="expanded">Expanded</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            )
            : null}
        </div>
      </LabeledSection>
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
