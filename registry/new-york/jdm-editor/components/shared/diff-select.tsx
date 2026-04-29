import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { ArrowDiffIcon } from "../arrow-diff-icon";

export type DiffSelectOption = { label: string; value: string };

export type DiffSelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  options?: DiffSelectOption[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  previousValue?: string;
  displayDiff?: boolean;
  direction?: "horizontal" | "vertical";
};

const SelectField: React.FC<
  Omit<DiffSelectProps, "previousValue" | "displayDiff" | "direction">
> = ({ value, onChange, options, disabled, className, placeholder }) => (
  <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger className={cn("w-full", className)}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {(options || []).map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const DiffSelect: React.FC<DiffSelectProps> = ({
  direction = "horizontal",
  previousValue,
  displayDiff,
  ...rest
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        direction === "vertical" && "flex-col items-start",
      )}>
      {displayDiff && (
        <>
          <SelectField
            {...rest}
            disabled
            value={previousValue}
            onChange={undefined}
            className={cn(rest.className, "text-removed")}
          />
          <ArrowDiffIcon
            direction={direction === "vertical" ? "down" : "right"}
          />
        </>
      )}
      <SelectField
        {...rest}
        disabled={rest.disabled || displayDiff}
        className={cn(rest.className, displayDiff && "text-added")}
      />
    </div>
  );
};
