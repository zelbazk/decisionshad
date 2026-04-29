import React from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type DiffRadioOption = { label: string; value: string };

export type DiffRadioProps = {
  value?: string;
  onChange?: (value: string) => void;
  options?: DiffRadioOption[];
  disabled?: boolean;
  previousValue?: string;
  displayDiff?: boolean;
};

export const DiffRadio: React.FC<DiffRadioProps> = ({
  displayDiff,
  previousValue,
  options,
  value,
  onChange,
  disabled,
}) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      className="flex flex-wrap gap-x-4 gap-y-1">
      {(options || []).map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <RadioGroupItem value={option.value} id={`rg-${option.value}`} />
          <Label
            htmlFor={`rg-${option.value}`}
            className={cn(
              displayDiff && option.value === previousValue && "text-removed",
              displayDiff && option.value === value && "text-added",
            )}>
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
