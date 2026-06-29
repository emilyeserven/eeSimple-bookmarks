import { createFileRoute } from "@tanstack/react-router";

import { GalleryListing } from "../components/GalleryManager";

export const Route = createFileRoute("/settings/advanced/manage-media")({
  component: ManageMediaPage,
});

function ManageMediaPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Manage Media</h2>
        <p className="text-sm text-muted-foreground">
          Every image stored in the bucket. Run a scan to catalog what&apos;s in storage. When a
          bookmark is deleted its image is preserved here as an orphan — use &quot;Attach&quot; to
          re-link it to another bookmark, or delete it to reclaim the space.
        </p>
      </div>
      <GalleryListing />
    </section>
  );
}
