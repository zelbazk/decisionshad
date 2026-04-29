import React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DiffInputProps = React.ComponentProps<"input"> & {
  previousValue?: string;
  displayDiff?: boolean;
};

export const DiffInput: React.FC<DiffInputProps> = ({
  previousValue,
  displayDiff,
  ...rest
}) => {
  if (displayDiff) {
    return (
      <div className="diff-input-group">
        {(previousValue || "")?.length > 0 && (
          <Input
            {...rest}
            value={previousValue}
            onChange={undefined}
            className={cn(rest.className, "previous-input")}
          />
        )}
        {((rest?.value || "") as string)?.length > 0 && (
          <Input {...rest} className={cn(rest.className, "current-input")} />
        )}
      </div>
    );
  }
  return <Input {...rest} />;
};
