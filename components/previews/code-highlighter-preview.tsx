"use client";

import { CodeHighlighter } from "@/registry/new-york/jdm-editor/components/code-editor/ce-highlight";

export function CodeHighlighterPreview() {
  return (
    <CodeHighlighter
      value='invoice.total > 1000 and invoice.status == "paid"'
      placeholder="Enter expression..."
      className="w-full border border-border rounded text-sm"
    />
  );
}
