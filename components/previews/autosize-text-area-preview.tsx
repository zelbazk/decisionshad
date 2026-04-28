"use client";

import { AutosizeTextArea } from "@/registry/new-york/jdm-editor/components/autosize-text-area";
import { useState } from "react";

export function AutosizeTextAreaPreview() {
  const [value, setValue] = useState("Edit me — I grow with content.");

  return (
    <AutosizeTextArea
      maxRows={6}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Type something..."
      className="w-64 min-h-[2rem] border border-border rounded px-2 py-1 text-sm outline-none"
    />
  );
}
