import { useUiStore } from "../stores/uiStore";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Advanced preferences — opt-in sidebar links to the Coolify instance, the Docs, and Storybook. */
export function AdvancedSettings() {
  const coolifyLinkEnabled = useUiStore(state => state.coolifyLinkEnabled);
  const setCoolifyLinkEnabled = useUiStore(state => state.setCoolifyLinkEnabled);
  const coolifyUrl = useUiStore(state => state.coolifyUrl);
  const setCoolifyUrl = useUiStore(state => state.setCoolifyUrl);
  const docsLinkEnabled = useUiStore(state => state.docsLinkEnabled);
  const setDocsLinkEnabled = useUiStore(state => state.setDocsLinkEnabled);
  const storybookLinkEnabled = useUiStore(state => state.storybookLinkEnabled);
  const setStorybookLinkEnabled = useUiStore(state => state.setStorybookLinkEnabled);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coolify link</CardTitle>
          <CardDescription>
            Show a link to your Coolify instance in the sidebar. The link opens in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="coolify-link-enabled"
              checked={coolifyLinkEnabled}
              onCheckedChange={checked => setCoolifyLinkEnabled(checked === true)}
            />
            <Label htmlFor="coolify-link-enabled">Show the Coolify link in the sidebar</Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="coolify-url">Coolify URL</Label>
            <Input
              id="coolify-url"
              type="url"
              placeholder="https://coolify.example.com"
              value={coolifyUrl}
              onChange={event => setCoolifyUrl(event.target.value)}
              className="
                w-full
                sm:w-96
              "
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Docs link</CardTitle>
          <CardDescription>
            Show a link to the Swagger/OpenAPI docs (
            <code>/docs</code>
            ) in the sidebar. Only
            reachable when the deployment has the docs enabled. The link opens in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="docs-link-enabled"
              checked={docsLinkEnabled}
              onCheckedChange={checked => setDocsLinkEnabled(checked === true)}
            />
            <Label htmlFor="docs-link-enabled">Show the Docs link in the sidebar</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storybook link</CardTitle>
          <CardDescription>
            Show a link to the Storybook UI (
            <code>/storybook</code>
            ) in the sidebar. Only reachable
            when the deployment has the docs enabled. The link opens in a new tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Checkbox
              id="storybook-link-enabled"
              checked={storybookLinkEnabled}
              onCheckedChange={checked => setStorybookLinkEnabled(checked === true)}
            />
            <Label htmlFor="storybook-link-enabled">Show the Storybook link in the sidebar</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
