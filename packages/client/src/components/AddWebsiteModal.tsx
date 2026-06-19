import type { Website } from "@eesimple/types";

import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateWebsite } from "../hooks/useWebsites";
import { useAppForm } from "../lib/form";

const schema = z.object({
  domain: z.string().trim().min(1, "Domain is required"),
  siteName: z.string().trim(),
});

interface AddWebsiteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (website: Website) => void;
}

export function AddWebsiteModal({ open, onOpenChange, onCreated }: AddWebsiteModalProps) {
  const createWebsite = useCreateWebsite();
  const form = useAppForm({
    defaultValues: { domain: "", siteName: "" },
    validators: { onChange: schema },
    onSubmit: ({ value }) => {
      createWebsite.mutate(
        { domain: value.domain.trim(), siteName: value.siteName.trim() || undefined },
        {
          onSuccess: (website) => {
            onCreated?.(website);
            onOpenChange(false);
            form.reset();
          },
        },
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New website</DialogTitle>
          <DialogDescription>
            Websites are normally created automatically from bookmark URLs — use this to add one
            by hand.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="domain">
            {field => <field.TextField label="Domain" placeholder="example.com" />}
          </form.AppField>
          <form.AppField name="siteName">
            {field => (
              <field.TextField label="Site name (optional)" placeholder="Defaults to the domain" />
            )}
          </form.AppField>
          {createWebsite.isError
            ? <p className="text-sm text-destructive">{createWebsite.error.message}</p>
            : null}
          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton label="Add website" pendingLabel="Adding…" />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
