import type { Editor } from "@tiptap/react";
import type { MarkdownStorage } from "tiptap-markdown";

import { useEffect } from "react";

import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered } from "lucide-react";
import { Markdown } from "tiptap-markdown";

import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

/** Read the serialized Markdown from the Markdown extension's storage (untyped on `editor.storage`).
 * Returns undefined when the extension storage isn't populated yet (TipTap v3 + React 19 timing). */
function getMarkdown(editor: Editor): string | undefined {
  const md = (editor.storage as unknown as { markdown?: MarkdownStorage }).markdown;
  return md?.getMarkdown();
}

interface RichTextEditorProps {
  /** Current content as Markdown. */
  value: string;
  /** Called with the serialized Markdown on every edit. Omit for read-only rendering. */
  onChange?: (markdown: string) => void;
  /** When false, renders the content read-only with no toolbar. Defaults to true. */
  editable?: boolean;
  /** Placeholder text width hint; forwarded to the wrapper. */
  className?: string;
}

/**
 * A reusable TipTap rich-text editor that reads and writes **Markdown**. In editable mode it shows a
 * small formatting toolbar; with `editable={false}` it renders the same content read-only (no
 * toolbar), so the homepage display matches what the settings editor produced. This is the shared
 * rich-text primitive — reuse it for future Markdown fields rather than adding another editor.
 */
export function RichTextEditor({
  value, onChange, editable = true, className,
}: RichTextEditorProps) {
  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Markdown.configure({
        linkify: true,
      }),
    ],
    content: value,
    onUpdate: ({
      editor: instance,
    }) => {
      const md = getMarkdown(instance);
      if (md !== undefined) onChange?.(md);
    },
    editorProps: {
      attributes: {
        class: cn(PROSE_CLASS, editable && "min-h-32 px-3 py-2"),
      },
    },
  });

  // Keep the editor in sync when `value` changes from the outside (e.g. data loads after mount).
  useEffect(() => {
    if (!editor) return;
    const current = getMarkdown(editor);
    if (current === undefined || value === current) return;
    editor.commands.setContent(value, {
      emitUpdate: false,
    });
  }, [editor, value]);

  // Reflect prop changes to editability after mount.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return null;

  if (!editable) {
    return (
      <EditorContent
        editor={editor}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        `
          rounded-md border border-input bg-background
          focus-within:border-ring focus-within:ring-[3px]
          focus-within:ring-ring/50
        `,
        className,
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

/** Tailwind styling for the rendered Markdown content (shared by editable and read-only modes). */
const PROSE_CLASS = `
  text-sm leading-relaxed outline-none
  [&_a]:text-primary [&_a]:underline
  [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold
  [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold
  [&_ol]:list-decimal [&_ol]:pl-5
  [&_p]:my-2
  [&_strong]:font-semibold
  [&_ul]:list-disc [&_ul]:pl-5
`;

function Toolbar({
  editor,
}: { editor: Editor }) {
  function promptForLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({
      href: url,
    }).run();
  }

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-input p-1"
    >
      <Toggle
        size="sm"
        aria-label="Bold"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </Toggle>
      <Toggle
        size="sm"
        aria-label="Italic"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </Toggle>
      <Toggle
        size="sm"
        aria-label="Heading 2"
        pressed={editor.isActive("heading", {
          level: 2,
        })}
        onPressedChange={() => editor.chain().focus().toggleHeading({
          level: 2,
        }).run()}
      >
        <Heading2 />
      </Toggle>
      <Toggle
        size="sm"
        aria-label="Heading 3"
        pressed={editor.isActive("heading", {
          level: 3,
        })}
        onPressedChange={() => editor.chain().focus().toggleHeading({
          level: 3,
        }).run()}
      >
        <Heading3 />
      </Toggle>
      <Toggle
        size="sm"
        aria-label="Bullet list"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </Toggle>
      <Toggle
        size="sm"
        aria-label="Ordered list"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </Toggle>
      <Toggle
        size="sm"
        aria-label="Link"
        pressed={editor.isActive("link")}
        onPressedChange={promptForLink}
      >
        <Link2 />
      </Toggle>
    </div>
  );
}
