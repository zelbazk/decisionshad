"use client";

import { ConfirmAction } from "@/registry/new-york/jdm-editor/components/confirm-action";

export function ConfirmActionPreview() {
  return (
    <div className="flex gap-4">
      <ConfirmAction onConfirm={() => alert("Deleted!")} />
      <ConfirmAction iconOnly onConfirm={() => alert("Deleted!")} />
    </div>
  );
}
