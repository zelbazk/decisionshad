"use client";

import { ExpressionBuilder } from "@/registry/new-york/jdm-editor/components/code-editor/business/expression-builder";
import { useState } from "react";

export function ExpressionBuilderPreview() {
  const [value, setValue] = useState(">= 100");

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <ExpressionBuilder value={value} onChange={setValue} />
      <ExpressionBuilder
        value={value}
        onChange={setValue}
        fieldType={{ type: "number" }}
      />
      <ExpressionBuilder
        value=""
        onChange={() => {}}
        fieldType={{ type: "boolean" }}
      />
      <ExpressionBuilder
        value=""
        onChange={() => {}}
        fieldType={{
          type: "string",
          enum: {
            type: "inline",
            values: [
              { label: "Admin", value: "admin" },
              { label: "User", value: "user" },
              { label: "Guest", value: "guest" },
            ],
          },
        }}
      />
    </div>
  );
}
