import type { TextMatch } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { TextMatchEditor } from "./TextMatchEditor";

const meta = {
  title: "Components/ExtensionFill/TextMatchEditor",
  component: TextMatchEditor,
  args: {
    match: {
      mode: "contains",
      value: "",
    },
    onChange: () => {},
  },
} satisfies Meta<typeof TextMatchEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [match, setMatch] = useState<TextMatch>({
      mode: "contains",
      value: "chapter",
    });
    return (
      <div className="w-72">
        <TextMatchEditor
          match={match}
          onChange={setMatch}
        />
      </div>
    );
  },
};

export const CaseSensitiveRegex: Story = {
  render: () => {
    const [match, setMatch] = useState<TextMatch>({
      mode: "regex",
      value: "^Ep\\.\\s*\\d+",
      caseSensitive: true,
    });
    return (
      <div className="w-72">
        <TextMatchEditor
          match={match}
          onChange={setMatch}
        />
      </div>
    );
  },
};
