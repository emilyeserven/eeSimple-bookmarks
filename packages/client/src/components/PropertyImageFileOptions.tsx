import type { PropertyFormApi } from "./propertyFormSchema";

import { LabeledSection } from "./LabeledSection";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function ImageFileOptions({
  form,
  idPrefix,
  isImage,
  full,
}: {
  form: PropertyFormApi;
  idPrefix: string;
  isImage: boolean;
  full: boolean;
}) {
  return (
    <>
      {full ? <Separator /> : null}

      <LabeledSection title="Property options">
        <div className="space-y-4">
          <form.AppField name="showInDetails">
            {field => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-show-in-details`}
                  checked={field.state.value}
                  onCheckedChange={checked => field.handleChange(checked === true)}
                />
                <Label htmlFor={`${idPrefix}-show-in-details`}>Show in detail view</Label>
              </div>
            )}
          </form.AppField>
          <p className="text-xs text-muted-foreground">
            {isImage
              ? "When checked, the uploaded image is shown on the bookmark detail page."
              : "When checked, a download link to the uploaded file is shown on the bookmark detail page."}
          </p>

          {isImage
            ? (
              <>
                <form.AppField name="showInGallery">
                  {field => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${idPrefix}-show-in-gallery`}
                        checked={field.state.value}
                        onCheckedChange={checked => field.handleChange(checked === true)}
                      />
                      <Label htmlFor={`${idPrefix}-show-in-gallery`}>Show in Media Management</Label>
                    </div>
                  )}
                </form.AppField>
                <p className="text-xs text-muted-foreground">
                  When checked, images uploaded for this property appear in Media Management and count toward your storage quota.
                </p>
              </>
            )
            : null}
        </div>
      </LabeledSection>
    </>
  );
}
