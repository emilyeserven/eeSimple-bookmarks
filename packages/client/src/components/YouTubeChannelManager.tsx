import type { YouTubeChannel } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick } from "./panel/useEditPanelClick";
import { useUpdateYouTubeChannel, useYouTubeChannels } from "../hooks/useYouTubeChannels";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** Read-only metadata list for a channel — shared by the view card and the edit row's Details section. */
function ChannelDetailsList({
  channel,
}: { channel: YouTubeChannel }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Added</dt>
      <dd>{new Date(channel.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">Channel key</dt>
      <dd>{channel.channelKey}</dd>
      <dt className="text-muted-foreground">Slug</dt>
      <dd>{channel.slug}</dd>
      {channel.bookmarkCount != null
        ? (
          <>
            <dt className="text-muted-foreground">Bookmarks</dt>
            <dd>{channel.bookmarkCount}</dd>
          </>
        )
        : null}
    </dl>
  );
}

/** A single editable channel row: rename only — the channel key is fixed and auto-assigned. */
export function YouTubeChannelRow({
  channel,
  onSaved,
}: { channel: YouTubeChannel;
  onSaved?: () => void; }) {
  const updateChannel = useUpdateYouTubeChannel();
  const [name, setName] = useState(channel.name);

  const dirty = name.trim() !== channel.name;
  const valid = name.trim().length > 0;

  function save(): void {
    if (!dirty || !valid) return;
    updateChannel.mutate(
      {
        id: channel.id,
        input: {
          name: name.trim(),
        },
      },
      {
        onSuccess: () => onSaved?.(),
      },
    );
  }

  return (
    <div className="space-y-6">
      <LabeledSection title="Channel name">
        <div
          className="
            grid gap-3
            sm:grid-cols-[1fr_auto] sm:items-end
          "
        >
          <div className="space-y-1">
            <Label htmlFor={`channel-name-${channel.id}`}>Channel name</Label>
            <Input
              id={`channel-name-${channel.id}`}
              value={name}
              onChange={event => setName(event.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || !valid || updateChannel.isPending}
            onClick={save}
          >
            {updateChannel.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        {updateChannel.isError
          ? <p className="mt-2 text-sm text-destructive">{updateChannel.error.message}</p>
          : null}
      </LabeledSection>

      <Separator />

      <LabeledSection
        title="Details"
        description="Assigned automatically — not editable."
      >
        <ChannelDetailsList channel={channel} />
      </LabeledSection>
    </div>
  );
}

/** Read-only display card for a single channel. Shared by the view page and the right panel's View body. */
export function YouTubeChannelCard({
  channel,
}: { channel: YouTubeChannel }) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold">{channel.name}</h2>
          <p className="truncate text-sm text-muted-foreground">{channel.channelKey}</p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/taxonomies/youtube-channels/$channelSlug/edit"
            params={{
              channelSlug: channel.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "youtube-channel", channel.id)}
          >
            Edit
          </Link>
        </Button>
      </div>

      <Separator />

      <LabeledSection title="Details">
        <ChannelDetailsList channel={channel} />
      </LabeledSection>
    </div>
  );
}

/** Manage the built-in YouTube Channels taxonomy: list every known channel and rename it. */
export function YouTubeChannelManager() {
  const {
    data: channels, isLoading, error,
  } = useYouTubeChannels();

  return (
    <section className="space-y-4">
      {isLoading ? <p className="text-muted-foreground">Loading channels…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && channels && channels.length === 0
        ? (
          <p className="text-muted-foreground">
            No channels yet. They&apos;re created automatically when you add YouTube bookmarks.
          </p>
        )
        : null}

      {channels && channels.length > 0
        ? (
          <ul className="space-y-3">
            {channels.map(channel => (
              <li
                key={channel.id}
                className="rounded-lg border bg-card p-4"
              >
                <YouTubeChannelRow channel={channel} />
              </li>
            ))}
          </ul>
        )
        : null}
    </section>
  );
}

/** Browsable, searchable channel listing — search + list only; channels can't be added by hand. Shared by the YouTube Channels taxonomy page and the Settings page. */
export function YouTubeChannelsListing() {
  const {
    data: allChannels, isLoading, error,
  } = useYouTubeChannels();
  const [search, setSearch] = useState("");
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  const filtered = (allChannels ?? []).filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.channelKey.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or channel key…"
        value={search}
        onChange={event => setSearch(event.target.value)}
        className="max-w-sm"
      />

      {isLoading ? <p className="text-muted-foreground">Loading channels…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (allChannels?.length ?? 0) === 0
        ? (
          <p className="text-muted-foreground">
            No channels yet. They&apos;re created automatically when you add YouTube bookmarks.
          </p>
        )
        : null}
      {!isLoading && (allChannels?.length ?? 0) > 0 && filtered.length === 0
        ? (
          <p className="text-muted-foreground">
            No channels match &ldquo;{search}&rdquo;.
          </p>
        )
        : null}

      {filtered.length > 0
        ? (
          <ul className="space-y-2">
            {filtered.map(channel => (
              <li
                key={channel.id}
                className="group relative rounded-lg border bg-card"
              >
                <Link
                  to="/taxonomies/youtube-channels/$channelSlug"
                  params={{
                    channelSlug: channel.slug,
                  }}
                  className="
                    flex items-center gap-3 rounded-lg p-4 pr-12
                    transition-colors
                    hover:bg-accent
                  "
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{channel.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{channel.channelKey}</p>
                  </div>
                  {channel.bookmarkCount !== undefined
                    ? <Badge variant="secondary">{channel.bookmarkCount}</Badge>
                    : null}
                </Link>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="
                    absolute top-1/2 right-2 -translate-y-1/2 opacity-0
                    transition-opacity
                    group-hover:opacity-100
                    focus-visible:opacity-100
                  "
                >
                  <Link
                    to="/taxonomies/youtube-channels/$channelSlug/edit"
                    params={{
                      channelSlug: channel.slug,
                    }}
                    title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                    onClick={event => editClick(event, "youtube-channel", channel.id)}
                  >
                    <Pencil className="size-4" />
                    <span className="sr-only">Edit {channel.name}</span>
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )
        : null}
    </div>
  );
}
