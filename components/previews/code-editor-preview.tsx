"use client";

import { CodeEditorBase } from "@/registry/new-york/jdm-editor/components/code-editor/ce-base";
import { useState } from "react";

export function CodeEditorPreview() {
  const [value, setValue] = useState(
    'invoice.total > 1000 and invoice.status == "paid"',
  );

  return (
    <CodeEditorBase
      value={value}
      onChange={setValue}
      placeholder="Enter expression..."
      className="w-full border border-border rounded text-sm"
    />
  );
}
