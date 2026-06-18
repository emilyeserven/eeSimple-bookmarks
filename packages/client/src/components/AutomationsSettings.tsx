import { useUiStore } from "../stores/uiStore";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Automation preferences for auto-fetching bookmark metadata. */
export function AutomationsSettings() {
  const autoFetchTitle = useUiStore(state => state.autoFetchTitle);
  const setAutoFetchTitle = useUiStore(state => state.setAutoFetchTitle);
  const autoFetchImage = useUiStore(state => state.autoFetchImage);
  const setAutoFetchImage = useUiStore(state => state.setAutoFetchImage);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Auto-fetch title</CardTitle>
          <CardDescription>
            When enabled, leaving the URL field while adding a bookmark fetches the page’s title
            automatically. You can always fetch it manually with the button next to the Name field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-fetch-title"
              checked={autoFetchTitle}
              onCheckedChange={checked => setAutoFetchTitle(checked === true)}
            />
            <Label htmlFor="auto-fetch-title">Fetch the title when the URL field loses focus</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fetch images by default</CardTitle>
          <CardDescription>
            When enabled, the Images section of the Add Bookmark form is collapsed by default — the
            page’s preview image will be fetched automatically when you save. Disable to always show
            the Images section expanded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-fetch-image"
              checked={autoFetchImage}
              onCheckedChange={checked => setAutoFetchImage(checked === true)}
            />
            <Label htmlFor="auto-fetch-image">Fetch the image when a bookmark is saved</Label>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
