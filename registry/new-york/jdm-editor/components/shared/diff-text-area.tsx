import React, { forwardRef } from "react";

import { cn } from "@/lib/utils";

import {
  AutosizeTextArea,
  type AutosizeTextAreaProps,
} from "../autosize-text-area";

export type DiffAutosizeTextAreaProps = AutosizeTextAreaProps & {
  previousValue?: string;
  displayDiff?: boolean;
  noStyle?: boolean;
};

export const DiffAutosizeTextArea = forwardRef<
  HTMLDivElement,
  DiffAutosizeTextAreaProps
>(({ previousValue, displayDiff, noStyle, ...rest }, ref) => {
  if (displayDiff) {
    return (
      <div className={cn("diff-text-area-group", noStyle && "no-style")}>
        {(previousValue || "")?.length > 0 && (
          <AutosizeTextArea
            {...rest}
            value={previousValue}
            onChange={undefined}
            className={cn(rest.className, "previous-input")}
          />
        )}
        {((rest.value || "") as string)?.length > 0 && (
          <AutosizeTextArea
            {...rest}
            className={cn(rest.className, "current-input")}
          />
        )}
      </div>
    );
  }
  return <AutosizeTextArea ref={ref} {...rest} />;
});
