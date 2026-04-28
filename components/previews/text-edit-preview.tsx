"use client";

import { useState } from "react";
import { TextEdit } from "@/registry/new-york/jdm-editor/components/text-edit";

export function TextEditPreview() {
  const [value, setValue] = useState("Click me to edit");

  return <TextEdit value={value} onChange={setValue} />;
}
