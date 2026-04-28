"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

type TextEditProps = {
  onChange?: (text: string) => void;
  value?: string;
  disabled?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "children">;

export const TextEdit: React.FC<TextEditProps> = ({
  className,
  value,
  onChange,
  disabled,
  ...props
}) => {
  const [contentEditing, setContentEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && contentEditing) {
      inputRef.current.value = value as string;
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [contentEditing]);

  return (
    <div className={cn("grl-text-edit", className)} {...props}>
      {!contentEditing && (
        <span
          className="grl-text-edit__text cursor-text"
          onClick={() => {
            if (!disabled) {
              setContentEditing(true);
            }
          }}>
          {value}
        </span>
      )}
      {contentEditing && (
        <input
          ref={inputRef}
          className={cn(
            "grl-text-edit__input nodrag",
            "w-full bg-transparent outline-none border-b border-border text-sm",
          )}
          onBlur={(e) => {
            if (e.target.value?.trim?.()?.length > 0) {
              onChange?.(inputRef?.current?.value as string);
            }
            e.preventDefault();
            setContentEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
              e.preventDefault();
            } else if (e.key === "Escape") {
              if (inputRef.current) {
                inputRef.current.value = value as string;
              }
              setContentEditing(false);
              e.preventDefault();
            }
          }}
        />
      )}
    </div>
  );
};
