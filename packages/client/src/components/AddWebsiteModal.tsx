import type { Website } from "@eesimple/types";

import { useId, useState } from "react";

import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateWebsite } from "../hooks/useWebsites";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddWebsiteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (website: Website) => void;
}

/**
 * Domain + optional site name modal to create a website by hand — a thin `InlineCreateModal`
 * wrapper using `nameLabel` for the domain field and `extraFields` for the optional site name.
 */
export function AddWebsiteModal({
  open,
  onOpenChange,
  onCreated,
}: AddWebsiteModalProps) {
  const {
    t,
  } = useTranslation();
  const createWebsite = useCreateWebsite();
  const [siteName, setSiteName] = useState("");
  const siteNameId = useId();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("New website")}
      description={t("Websites are normally created automatically from bookmark URLs — use this to add one by hand.")}
      placeholder="example.com"
      nameLabel={t("Domain")}
      nameRequiredMessage="Domain is required"
      submitLabel={t("Add website")}
      isError={createWebsite.isError}
      errorMessage={createWebsite.error?.message}
      extraFields={(
        <div className="space-y-1">
          <Label htmlFor={siteNameId}>{t("Site name (optional)")}</Label>
          <Input
            id={siteNameId}
            placeholder={t("Defaults to the domain")}
            value={siteName}
            onChange={e => setSiteName(e.target.value)}
          />
        </div>
      )}
      onSubmit={(domain, done) => {
        createWebsite.mutate(
          {
            domain,
            siteName: siteName.trim() || undefined,
          },
          {
            onSuccess: (website) => {
              onCreated?.(website);
              setSiteName("");
              done();
            },
          },
        );
      }}
    />
  );
}
