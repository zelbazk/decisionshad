"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrashIcon } from "lucide-react";
import React, { useState } from "react";
import { P, match } from "ts-pattern";

export type ConfirmActionProps = {
  iconOnly?: boolean;
  text?: string;
  confirmText?: string;
  icon?: React.ReactNode;
  onConfirm?: () => void;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
} & Omit<ButtonProps, "children" | "onClick" | "onBlur">;

export const ConfirmAction: React.FC<ConfirmActionProps> = ({
  iconOnly = false,
  text = "Delete",
  confirmText = "Really delete?",
  icon = <TrashIcon data-icon="inline-start" />,
  onClick,
  onBlur,
  onConfirm,
  disabled,
  ...props
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const tooltipOpen = match([iconOnly, disabled])
    .with([P._, true], () => false)
    .with([false, P._], () => false)
    .otherwise(() => undefined);

  return (
    <Tooltip open={tooltipOpen}>
      <TooltipTrigger asChild>
        <Button
          variant={isConfirming ? "destructive" : "ghost"}
          size={iconOnly ? "icon" : "default"}
          disabled={disabled}
          onClick={(event) => {
            onClick?.(event);
            if (isConfirming) {
              onConfirm?.();
              setIsConfirming(false);
              return;
            }
            setIsConfirming(true);
          }}
          onBlur={(event) => {
            onBlur?.(event);
            setIsConfirming(false);
          }}
          {...props}>
          {icon}
          {match([iconOnly, isConfirming])
            .with([false, true], () => confirmText)
            .with([false, false], () => text)
            .otherwise(() => undefined)}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isConfirming ? confirmText : text}</TooltipContent>
    </Tooltip>
  );
};
