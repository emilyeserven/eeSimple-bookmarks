import type { BookmarkAddFormStandardField } from "@eesimple/types";
import type { LucideIcon } from "lucide-react";

import { useState } from "react";

import { BOOKMARK_ADD_FORM_PLACEMENTS, BOOKMARK_ADD_FORM_STANDARD_FIELDS } from "@eesimple/types";
import {
  Ban,
  Building2,
  CaseSensitive,
  Clapperboard,
  Drama,
  Eye,
  Film,
  FolderOpen,
  Image,
  Languages,
  MapPin,
  MapPinOff,
  Tags,
  Type,
  Users,
  UserRound,
} from "lucide-react";

import { BookmarkAddFormPreviewDialog } from "./BookmarkAddFormPreviewDialog";
import { SegmentedToggleRow } from "./SegmentedToggleRow";
import {
  BOOKMARK_ADD_FORM_STANDARD_LABELS,
  standardFieldPlacement,
  useBookmarkAddFormSettingsPage,
} from "../hooks/useBookmarkAddFormSettingsPage";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** The three placement segments shown on every row. */
const PLACEMENT_OPTIONS = [
  {
    value: "default",
    label: "Default",
  },
  {
    value: "advanced",
    label: "Advanced",
  },
  {
    value: "hidden",
    label: "Hidden",
  },
] as const satisfies readonly { value: typeof BOOKMARK_ADD_FORM_PLACEMENTS[number];
  label: string; }[];

/** A distinct lucide icon per standard field. */
const STANDARD_FIELD_ICONS: Record<BookmarkAddFormStandardField, LucideIcon> = {
  title: Type,
  romanizedName: CaseSensitive,
  categoryId: FolderOpen,
  mediaTypeId: Clapperboard,
  languageId: Languages,
  groupId: Building2,
  descriptionTags: Tags,
  personIds: UserRound,
  image: Image,
  groupIds: Users,
  genreMoodIds: Drama,
  locationIds: MapPin,
  mediaLink: Film,
  blacklistedTagIds: Ban,
  blacklistedLocationIds: MapPinOff,
};

function fieldIcon(Icon: LucideIcon) {
  return <Icon className="size-3.5 shrink-0 text-muted-foreground" />;
}

/**
 * Settings → Display → Bookmark Add Form: a three-state (Default / Advanced / Hidden) placement
 * control for every field of the quick Add Bookmark form.
 */
export function DisplayBookmarkAddSettings() {
  const {
    config,
    setStandardFieldPlacement,
    setBuiltInPropertyPlacement,
    setCustomPropertyPlacement,
    detailProperties,
    customProperties,
  } = useBookmarkAddFormSettingsPage();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Bookmark Add Form</h2>
          <p className="text-sm text-muted-foreground">
            Choose which fields the quick Add Bookmark form shows, and where.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="size-4" />
          Preview
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Standard fields</CardTitle>
          <CardDescription>
            Choose where each Add Bookmark form field appears — in the main area (Default), tucked into
            the collapsible Advanced section, or hidden. The URL field is always shown. Placement only
            affects the Add Bookmark form; every field stays editable after a bookmark is created.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {BOOKMARK_ADD_FORM_STANDARD_FIELDS.map(field => (
            <SegmentedToggleRow
              key={field}
              label={BOOKMARK_ADD_FORM_STANDARD_LABELS[field]}
              icon={fieldIcon(STANDARD_FIELD_ICONS[field])}
              options={PLACEMENT_OPTIONS}
              value={standardFieldPlacement(config, field)}
              onChange={placement => setStandardFieldPlacement(field, placement)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Built-in detail properties</CardTitle>
          <CardDescription>
            Detail properties (runtime, progress, sections…) are hidden from the quick Add form by
            default and are better filled after creation. They stay editable on a bookmark&apos;s
            edit Properties tab regardless of the choice here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {detailProperties.map(row => (
            <SegmentedToggleRow
              key={row.slug}
              label={row.label}
              options={PLACEMENT_OPTIONS}
              value={row.placement}
              onChange={placement => setBuiltInPropertyPlacement(row.slug, row.label, placement)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom properties</CardTitle>
          <CardDescription>
            Place your own custom properties on the Add Bookmark form. Unlike the other sections,
            Hidden here hides the property from every bookmark form — both creating and editing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {customProperties.map(row => (
            <SegmentedToggleRow
              key={row.property.id}
              label={row.property.name}
              hint={row.hint}
              options={PLACEMENT_OPTIONS}
              value={row.placement}
              onChange={placement => setCustomPropertyPlacement(row.property, placement)}
            />
          ))}
          {customProperties.length === 0 && (
            <p className="text-sm text-muted-foreground">No custom properties yet.</p>
          )}
        </CardContent>
      </Card>

      <BookmarkAddFormPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
