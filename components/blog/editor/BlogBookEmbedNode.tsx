"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { BookOpen, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type BookPreview = { id: string; title: string; author: string; coverImage: string | null };

function EditorBookEmbed({ node, deleteNode }: NodeViewProps) {
  const bookId = typeof node.attrs.bookId === "string" ? node.attrs.bookId : "";
  const [book, setBook] = useState<BookPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void fetch(`/api/admin/home/books?q=${encodeURIComponent(bookId)}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as { results?: BookPreview[] };
        return data.results?.find((item) => item.id === bookId) ?? null;
      })
      .then((result) => setBook(result))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [bookId]);

  return (
    <NodeViewWrapper as="div" className="not-prose my-4" contentEditable={false}>
      <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-3 shadow-sm">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-primary">کتاب درج‌شده در مقاله</p>
          <p className="truncate text-sm font-black text-foreground">{book?.title ?? "کتاب انتخاب‌شده"}</p>
          <p className="truncate text-xs text-muted-foreground">{book?.author ?? "ارجاع به کاتالوگ"}</p>
        </div>
        <button type="button" onClick={deleteNode} className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" aria-label="حذف کتاب درج‌شده" title="حذف کتاب">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

export const BlogBookEmbedNode = Node.create({
  name: "blogBookEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      bookId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-blog-book-id"),
        renderHTML: (attributes) =>
          typeof attributes.bookId === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(attributes.bookId)
            ? { "data-blog-book-id": attributes.bookId }
            : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-blog-book-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(EditorBookEmbed);
  },
});
