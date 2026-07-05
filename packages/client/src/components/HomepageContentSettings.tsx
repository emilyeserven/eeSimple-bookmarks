import type { HomepageContentSettings as HomepageContent, HomepageContentWidth, HomepageWidget, QuickAddDisplay } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { DEFAULT_HOMEPAGE_WIDGET_ORDER, resolveHomepageWidgetOrder } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { HomepageWidgetOrderList } from "./HomepageWidgetOrderList";
import { LabeledSection } from "./LabeledSection";
import {
  useHomepageContentSettings,
  useUpdateHomepageContentSettings,
} from "../hooks/useAppSettings";

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
  homepageTextEnabled: true,
  searchEnabled: false,
  searchWidth: "full",
  widgetOrder: DEFAULT_HOMEPAGE_WIDGET_ORDER,
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
    t,
  } = useTranslation();
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
      update.mutate(formRef.current);
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
    return <p className="text-sm text-muted-foreground">{t("Loading…")}</p>;
  }

  return (
    <div className="space-y-6">
      <LabeledSection
        title={t("Homepage Text")}
        description={t("Markdown shown at the very top of your homepage. Uncheck “Show homepage text” to hide it without losing your draft.")}
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.homepageHeaderHidden}
              onCheckedChange={checked => setField("homepageHeaderHidden", checked === true)}
            />
            {t("Hide default “Homepage” title and description")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.homepageTextEnabled}
              onCheckedChange={checked => setField("homepageTextEnabled", checked === true)}
            />
            {t("Show homepage text")}
          </label>
          <RichTextEditor
            value={form.homepageText}
            onChange={markdown => setField("homepageText", markdown)}
          />
          <WidthToggle
            label={t("Desktop width")}
            value={form.homepageTextWidth}
            onChange={width => setField("homepageTextWidth", width)}
          />
        </div>
      </LabeledSection>

      <Separator />

      <LabeledSection
        title={t("Bookmark Quick Add")}
        description={t("Show the Add Bookmark form on the homepage, below the homepage text.")}
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.bookmarkQuickAddEnabled}
              onCheckedChange={checked => setField("bookmarkQuickAddEnabled", checked === true)}
            />
            {t("Enable Bookmark Quick Add")}
          </label>

          {form.bookmarkQuickAddEnabled
            ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <WidthToggle
                  label={t("Desktop width")}
                  value={form.bookmarkQuickAddWidth}
                  onChange={width => setField("bookmarkQuickAddWidth", width)}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{t("Display")}</Label>
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={form.bookmarkQuickAddDisplay}
                    onValueChange={(value) => {
                      if (value) setField("bookmarkQuickAddDisplay", value as QuickAddDisplay);
                    }}
                  >
                    <ToggleGroupItem value="collapsible">{t("Collapsible")}</ToggleGroupItem>
                    <ToggleGroupItem value="expanded">{t("Expanded")}</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            )
            : null}
        </div>
      </LabeledSection>

      <Separator />

      <LabeledSection
        title={t("Search from Homepage")}
        description={t("Show a search box on the homepage. Submitting it opens the Bookmarks page filtered to what you typed.")}
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.searchEnabled}
              onCheckedChange={checked => setField("searchEnabled", checked === true)}
            />
            {t("Enable Search from Homepage")}
          </label>

          {form.searchEnabled
            ? (
              <WidthToggle
                label={t("Desktop width")}
                value={form.searchWidth}
                onChange={width => setField("searchWidth", width)}
              />
            )
            : null}
        </div>
      </LabeledSection>

      <Separator />

      <LabeledSection
        title={t("Reorder Homepage Widgets")}
        description={t("Drag to change the order the homepage text, Bookmark Quick Add, and search box appear in.")}
      >
        <HomepageWidgetOrderList
          value={resolveHomepageWidgetOrder(form.widgetOrder)}
          onChange={order => setField("widgetOrder", order)}
          disabledWidgets={hiddenWidgets(form)}
        />
      </LabeledSection>
    </div>
  );
}

/** Which widgets are currently turned off, for the muted "hidden" hint in the reorder list. */
function hiddenWidgets(form: HomepageContent): HomepageWidget[] {
  const hidden: HomepageWidget[] = [];
  if (!(form.homepageTextEnabled && form.homepageText.trim())) hidden.push("homepageText");
  if (!form.bookmarkQuickAddEnabled) hidden.push("bookmarkQuickAdd");
  if (!form.searchEnabled) hidden.push("search");
  return hidden;
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
  const {
    t,
  } = useTranslation();
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
        <ToggleGroupItem value="full">{t("Full")}</ToggleGroupItem>
        <ToggleGroupItem value="half">{t("Half")}</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
