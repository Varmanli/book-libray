"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";

export default function AdminRichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noreferrer noopener",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "توضیحات کتاب را اینجا بنویس...",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        dir: "rtl",
        class:
          "ProseMirror min-h-64 px-5 py-4 text-sm leading-8 text-foreground outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-r-2 [&_blockquote]:border-primary/35 [&_blockquote]:pr-4 [&_blockquote]:text-foreground/90 [&_h2]:text-xl [&_h2]:font-black [&_h3]:text-lg [&_h3]:font-black [&_ol]:list-decimal [&_ol]:pr-6 [&_p.is-editor-empty:first-child::before]:float-right [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:text-muted-foreground/70 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_ul]:list-disc [&_ul]:pr-6",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("لینک را وارد کن", previousUrl ?? "https://");
    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-border/75 bg-background/70 shadow-inner transition focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-card/75 p-3">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<Bold className="h-4 w-4" />}
          label="بولد"
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<Italic className="h-4 w-4" />}
          label="ایتالیک"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Heading2 className="h-4 w-4" />}
          label="تیتر ۲"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={<Heading3 className="h-4 w-4" />}
          label="تیتر ۳"
        />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<List className="h-4 w-4" />}
          label="فهرست"
        />
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<ListOrdered className="h-4 w-4" />}
          label="شماره‌دار"
        />
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={<Quote className="h-4 w-4" />}
          label="نقل‌قول"
        />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          icon={<Link2 className="h-4 w-4" />}
          label="لینک"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          icon={<RemoveFormatting className="h-4 w-4" />}
          label="پاک‌سازی"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          icon={<Undo2 className="h-4 w-4" />}
          label="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          icon={<Redo2 className="h-4 w-4" />}
          label="Redo"
        />
      </div>

      <EditorContent editor={editor} className="bg-transparent" />
    </div>
  );
}

function ToolbarButton({
  active = false,
  disabled = false,
  onClick,
  icon,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition",
        active
          ? "border-primary/30 bg-primary/12 text-primary"
          : "border-border/70 bg-background/70 text-foreground hover:border-primary/25 hover:text-primary",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
