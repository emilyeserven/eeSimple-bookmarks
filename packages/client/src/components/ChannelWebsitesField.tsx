import type { Website } from "@eesimple/types";

import { useState } from "react";

import { AddWebsiteModal } from "./AddWebsiteModal";
import { MultiCombobox } from "./MultiCombobox";

import { Label } from "@/components/ui/label";

interface Props {
  websites: Website[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select field for associating websites with a YouTube channel — the mirror of
 * `WebsiteYouTubeChannelsField`. Saving happens immediately on each selection change.
 */
export function ChannelWebsitesField({
  websites,
  selectedIds,
  onChange,
}: Props) {
  const [addWebsiteOpen, setAddWebsiteOpen] = useState(false);

  const options = websites.map(website => ({
    value: website.id,
    label: website.siteName,
  }));

  return (
    <>
      <div className="space-y-2">
        <Label className="block">Websites</Label>
        <p className="text-sm text-muted-foreground">
          Websites associated with this channel.
        </p>
        <MultiCombobox
          options={options}
          values={selectedIds}
          onValuesChange={onChange}
          placeholder="No websites selected"
          searchPlaceholder="Search websites…"
          emptyText="No websites found."
          createOption={{
            label: "Add website",
            onSelect: () => setAddWebsiteOpen(true),
          }}
        />
      </div>
      <AddWebsiteModal
        open={addWebsiteOpen}
        onOpenChange={setAddWebsiteOpen}
        onCreated={website => onChange([...selectedIds, website.id])}
      />
    </>
  );
}
