"use client";

import { ChevronDownIcon } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { ConfirmAction } from "../../confirm-action";
import { Stack } from "../../stack";

type FieldEditPopoverProps = {
  value?: string;
  onSubmit: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerClassName?: string;
  children: React.ReactNode;
  mode?: "edit" | "create";
  trigger?: React.ReactNode;
};

export const FieldEditPopover: React.FC<FieldEditPopoverProps> = ({
  value,
  onSubmit,
  onRemove,
  disabled,
  open,
  onOpenChange,
  triggerClassName,
  children,
  mode = "edit",
  trigger,
}) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>
      {trigger ?? (
        <button
          type="button"
          className={cn(
            "grl-field-edit",
            !value && "text-muted-foreground",
            triggerClassName,
          )}
          onClick={() => onOpenChange(!open)}>
          <span className="span-overflow">{value || "-"}</span>
          <ChevronDownIcon size={12} className="ml-1 shrink-0" />
        </button>
      )}
    </PopoverTrigger>
    <PopoverContent
      align="start"
      className="w-75"
      data-simulation="propagateWithTimeout"
      onKeyDownCapture={(e) => {
        const isSubmit = (e.ctrlKey || e.metaKey) && e.key === "Enter";
        const isCancel = e.key === "Escape";
        if (!isSubmit && !isCancel) return;

        e.preventDefault();
        e.stopPropagation();
        onOpenChange(false);
        if (!disabled && isSubmit) onSubmit();
      }}>
      {children}
      <div
        className={cn(
          "grl-field-edit__footer mt-4",
          mode === "create" && "justify-end",
        )}>
        {mode === "edit" && (
          <ConfirmAction iconOnly onConfirm={onRemove} disabled={disabled} />
        )}
        <Stack horizontal width="auto" verticalAlign="end">
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={disabled} onClick={onSubmit}>
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </Stack>
      </div>
    </PopoverContent>
  </Popover>
);
