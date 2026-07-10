import type { ParamRuleDraft } from "../lib/websiteForm";
import type { ShortenedLink } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { ParamRulesEditor, ShortenedLinksEditor } from "./WebsiteEditors";

function ShortenedLinksHost({
  initial = [],
}: { initial?: ShortenedLink[] }) {
  const [links, setLinks] = useState<ShortenedLink[]>(initial);
  return (
    <div className="max-w-2xl">
      <ShortenedLinksEditor
        idBase="story"
        links={links}
        onChange={setLinks}
      />
    </div>
  );
}

function ParamRulesHost({
  initial = [],
}: { initial?: ParamRuleDraft[] }) {
  const [rules, setRules] = useState<ParamRuleDraft[]>(initial);
  return (
    <div className="max-w-2xl">
      <ParamRulesEditor
        idBase="story"
        rules={rules}
        onChange={setRules}
      />
    </div>
  );
}

const meta = {
  title: "Components/WebsiteEditors",
  component: ShortenedLinksEditor,
} satisfies Meta<typeof ShortenedLinksEditor>;

export default meta;

/** The shortened-links editor with one verified short domain and an expansion template. */
export const ShortenedLinks: StoryObj = {
  render: () => (
    <ShortenedLinksHost
      initial={[
        {
          domain: "youtu.be",
          expandTo: "https://www.youtube.com/watch?v={id}",
          keepShortened: false,
        },
      ]}
    />
  ),
};

/** The shortened-links editor with no rows yet. */
export const ShortenedLinksEmpty: StoryObj = {
  render: () => <ShortenedLinksHost />,
};

/** The keep-param rules editor with one path-scoped whitelist rule. */
export const ParamRules: StoryObj = {
  render: () => (
    <ParamRulesHost
      initial={[
        {
          pathSuffix: "/watch",
          matchMode: "suffix",
          paramsText: "v, list",
        },
      ]}
    />
  ),
};
