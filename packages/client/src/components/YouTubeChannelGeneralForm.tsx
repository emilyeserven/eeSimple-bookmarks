import type { YouTubeChannel } from "@eesimple/types";

import { z } from "zod";

import { useUpdateYouTubeChannel } from "@/hooks/useYouTubeChannels";
import { useAppForm } from "@/lib/form";

const channelGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

interface Props {
  channel: YouTubeChannel;
}

/** Edit a YouTube channel's display name. */
export function YouTubeChannelGeneralForm({
  channel,
}: Props) {
  const updateChannel = useUpdateYouTubeChannel();

  const form = useAppForm({
    defaultValues: {
      name: channel.name,
    },
    validators: {
      onChange: channelGeneralSchema,
    },
    onSubmit: ({
      value,
    }) => {
      updateChannel.mutate({
        id: channel.id,
        input: {
          name: value.name.trim(),
        },
      });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {field => (
          <field.TextField label="Channel name" />
        )}
      </form.AppField>

      <form.AppForm>
        <form.Subscribe selector={state => state.values}>
          {(values) => {
            const dirty = values.name.trim() !== channel.name;
            return (
              <form.SubmitButton
                label="Save changes"
                size="sm"
                disabledWhen={!dirty}
              />
            );
          }}
        </form.Subscribe>
      </form.AppForm>
    </form>
  );
}
