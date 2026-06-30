import type { NotificationRecord } from "../../stores/notificationStore";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { NotificationsPanel } from "./NotificationsPanel";
import { useNotificationStore } from "../../stores/notificationStore";

const records: NotificationRecord[] = [
  {
    id: "n-1",
    type: "success",
    message: "Saved “Name” for Workflow.",
    timestamp: "2026-06-01T09:30:00.000Z",
  },
  {
    id: "n-2",
    type: "error",
    message: "Could not save “Priority” — value out of range.",
    timestamp: "2026-06-01T09:28:00.000Z",
    link: {
      label: "File issue",
      href: "https://github.com/example/repo/issues/new",
    },
  },
];

const meta = {
  title: "Components/Panel/NotificationsPanel",
  component: NotificationsPanel,
} satisfies Meta<typeof NotificationsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A log with recorded success/error toasts, newest first. */
export const Default: Story = {
  decorators: [
    (Story) => {
      useNotificationStore.setState({
        notifications: records,
      });
      return <Story />;
    },
  ],
};

/** The empty state before any toast has fired. */
export const Empty: Story = {
  decorators: [
    (Story) => {
      useNotificationStore.setState({
        notifications: [],
      });
      return <Story />;
    },
  ],
};
