import React from "react";

import { cn } from "@/lib/utils";

import type { CodeEditorProps, CodeEditorRef } from "../code-editor";
import { CodeEditor } from "../code-editor";

export type DiffCodeEditorProps = CodeEditorProps & {
  displayDiff?: boolean;
  previousValue?: string;
  noStyle?: boolean;
};

export const DiffCodeEditor = React.forwardRef<
  CodeEditorRef,
  DiffCodeEditorProps
>(({ displayDiff, previousValue, noStyle, ...rest }, ref) => {
  if (displayDiff) {
    return (
      <div className={cn("diff-code-editor", noStyle && "no-style")}>
        {(previousValue || "")?.length > 0 && (
          <CodeEditor
            {...rest}
            className={cn(rest.className, "previous-input")}
            value={previousValue}
            onChange={undefined}
            disabled={true}
            noStyle
            lint={false}
          />
        )}
        {(rest?.value || "")?.length > 0 && (
          <CodeEditor
            {...rest}
            className={cn(rest.className, "current-input")}
            disabled={true}
            noStyle
            lint={false}
          />
        )}
      </div>
    );
  }

  return <CodeEditor ref={ref} noStyle={noStyle} {...rest} />;
});
