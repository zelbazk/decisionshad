import React from "react";

import { Switch } from "@/components/ui/switch";

import { ArrowDiffIcon } from "../arrow-diff-icon";

export type DiffSwitchProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  previousChecked?: boolean;
  displayDiff?: boolean;
};

export const DiffSwitch: React.FC<DiffSwitchProps> = ({
  displayDiff,
  previousChecked,
  ...rest
}) => {
  return (
    <div className="flex items-center gap-1">
      {displayDiff && (
        <>
          <Switch disabled={rest.disabled} checked={previousChecked} />
          <ArrowDiffIcon />
        </>
      )}
      <Switch {...rest} />
    </div>
  );
};
