"use client";

import { CodeEditor } from "@/registry/new-york/jdm-editor/components/code-editor/ce";
import { useState } from "react";

export function CodeEditorPreview() {
  const [value, setValue] = useState(
    'invoice.total > 1000 and invoice.status == "paid"',
  );

  return (
    <CodeEditor
      value={value}
      onChange={setValue}
      placeholder="Enter expression..."
      className="w-full border border-border rounded text-sm"
    />
  );
}

export function CodeEditorLazyPreview() {
  const [value, setValue] = useState(
    'invoice.total > 1000 and invoice.status == "paid"',
  );

  return (
    <CodeEditor
      lazy
      value={value}
      onChange={setValue}
      placeholder="Click to edit..."
      className="w-full border border-border rounded text-sm"
    />
  );
}
