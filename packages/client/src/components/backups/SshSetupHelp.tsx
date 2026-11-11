import { useTranslation } from "react-i18next";

/** One "How do I turn on SSH?" entry: the steps plus the official guide. */
function SetupEntry({
  title, steps, guide,
}: { title: string;
  steps: string[];
  guide: string; }) {
  const {
    t,
  } = useTranslation();
  return (
    <details className="rounded-md border px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium">{title}</summary>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
        {steps.map(step => <li key={step}>{step}</li>)}
      </ol>
      <a
        href={guide}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs underline underline-offset-2"
      >
        {t("Official guide")}
      </a>
    </details>
  );
}

/** Short, per-OS steps for turning on SSH on the computer that will receive backups. */
export function SshSetupHelp() {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {t("The other computer needs SSH turned on. It's a built-in switch on Mac, Linux and Windows:")}
      </p>
      <SetupEntry
        title={t("Mac")}
        steps={[
          t("Open System Settings → General → Sharing."),
          t("Turn on Remote Login."),
          t("Click the ⓘ next to it and make sure your user is allowed."),
        ]}
        guide="https://support.apple.com/guide/mac-help/allow-a-remote-computer-to-access-your-mac-mchlp1066/mac"
      />
      <SetupEntry
        title={t("Linux (Ubuntu, Debian, Raspberry Pi OS)")}
        steps={[
          t("Run: sudo apt install openssh-server"),
          t("Run: sudo systemctl enable --now ssh"),
        ]}
        guide="https://ubuntu.com/server/docs/openssh-server"
      />
      <SetupEntry
        title={t("Windows 10 or 11")}
        steps={[
          t("Open Settings → System → Optional features → View features, and add OpenSSH Server."),
          t("Open the Services app, find OpenSSH SSH Server, set Startup type to Automatic, and start it."),
        ]}
        guide="https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse"
      />
    </div>
  );
}
