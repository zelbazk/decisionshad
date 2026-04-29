"use client";

import { CodeEditorPreview as CePreview } from "@/registry/new-york/jdm-editor/components/code-editor/ce-preview";

export function CePreviewWrapper() {
  return (
    <CePreview
      expression='invoice.total > 1000 and invoice.status == "paid"'
      initial={{
        expression: 'invoice.total > 1000 and invoice.status == "paid"',
        result: true,
      }}
    />
  );
}
