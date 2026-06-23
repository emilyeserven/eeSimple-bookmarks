/** Copy text to the clipboard, falling back to execCommand for non-HTTPS contexts. */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for HTTP (non-localhost) where the Clipboard API is unavailable.
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  try {
    if (!document.execCommand("copy")) throw new Error("execCommand returned false");
  }
  finally {
    document.body.removeChild(el);
  }
}
