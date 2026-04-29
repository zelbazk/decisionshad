import React, { useEffect, useRef, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  type ColumnEnum,
  OUTPUT_FIELD_TYPE_OPTIONS,
  type OutputFieldType,
} from "../../../helpers/schema";
import { AutosizeTextArea } from "../../autosize-text-area";
import { useDecisionTableState } from "../context/dt-store.context";
import {
  ENUM_MODE_OPTIONS,
  type EnumMode,
  getEnumMode,
  parseEnumString,
  serializeEnumValues,
} from "./enum-utils";
import { FieldEditPopover } from "./field-edit-popover";
import { FieldTypeTags } from "./field-type-tags";

const getEnumFromFieldType = (ft?: OutputFieldType): ColumnEnum | undefined => {
  if (!ft) return undefined;
  if (ft.type === "string" || ft.type === "string-array") return ft.enum;
  return undefined;
};

type OutputFieldEditProps = {
  disabled?: boolean;
  value?: string;
  onChange?: (value: string, fieldType?: OutputFieldType) => void;
  onRemove?: () => void;
  fieldType?: OutputFieldType;
  mode?: "edit" | "create";
  trigger?: React.ReactNode;
  onCreate?: (
    name: string,
    field: string,
    outputFieldType?: OutputFieldType,
  ) => void;
};

export const OutputFieldEdit: React.FC<OutputFieldEditProps> = ({
  disabled,
  value,
  onChange,
  onRemove,
  fieldType,
  mode = "edit",
  trigger,
  onCreate,
}) => {
  const dictionaries = useDecisionTableState((s) => s.dictionaries) ?? {};
  const uiMode = useDecisionTableState((s) => s.mode);
  const showAdvanced = uiMode === "business";
  const [open, setOpen] = useState(false);
  const [innerName, setInnerName] = useState("");
  const [innerValue, setInnerValue] = useState(value);
  const [innerFieldType, setInnerFieldType] = useState<OutputFieldType["type"]>(
    fieldType?.type ?? "auto",
  );
  const ftEnum = getEnumFromFieldType(fieldType);
  const [enumMode, setEnumMode] = useState<EnumMode>(getEnumMode(ftEnum));
  const [enumText, setEnumText] = useState(
    ftEnum?.type === "inline" ? serializeEnumValues(ftEnum.values) : "",
  );
  const [enumRef, setEnumRef] = useState(
    ftEnum?.type === "ref" ? ftEnum.ref : "",
  );
  const [enumLoose, setEnumLoose] = useState(ftEnum?.loose ?? false);
  const input = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (mode === "create") {
        setInnerName("");
        setInnerValue("");
        setInnerFieldType("auto");
        setEnumMode("none");
        setEnumText("");
        setEnumRef("");
        setEnumLoose(false);
        setTimeout(() => {
          input.current?.focus();
        });
      } else {
        setInnerValue(value);
        setInnerFieldType(fieldType?.type ?? "auto");
        const e = getEnumFromFieldType(fieldType);
        setEnumMode(getEnumMode(e));
        setEnumText(e?.type === "inline" ? serializeEnumValues(e.values) : "");
        setEnumRef(e?.type === "ref" ? e.ref : "");
        setEnumLoose(e?.loose ?? false);
        if (!input.current) return;

        input.current.focus();
        input.current.select();
      }
    }
  }, [open]);

  const supportsEnum =
    innerFieldType === "string" || innerFieldType === "string-array";

  const buildOutputFieldType = (): OutputFieldType | undefined => {
    if (!showAdvanced)
      return fieldType?.type === "auto" ? undefined : fieldType;
    if (innerFieldType === "auto") return undefined;
    if (innerFieldType === "string" || innerFieldType === "string-array") {
      let enumConfig: ColumnEnum | undefined;
      if (enumMode === "inline") {
        const items = parseEnumString(enumText);
        if (items.length)
          enumConfig = {
            type: "inline",
            values: items,
            ...(enumLoose ? { loose: true } : {}),
          };
      } else if (enumMode === "ref" && enumRef) {
        enumConfig = {
          type: "ref",
          ref: enumRef,
          ...(enumLoose ? { loose: true } : {}),
        };
      }
      return {
        type: innerFieldType,
        ...(enumConfig ? { enum: enumConfig } : {}),
      };
    }
    return { type: innerFieldType } as OutputFieldType;
  };

  const handleSubmit = () => {
    if (mode === "create") {
      onCreate?.(
        innerName || "Output",
        innerValue ?? "output",
        buildOutputFieldType(),
      );
    } else {
      onChange?.(innerValue ?? "", buildOutputFieldType());
    }
    setOpen(false);
  };

  return (
    <FieldEditPopover
      value={value}
      onSubmit={handleSubmit}
      onRemove={onRemove}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
      triggerClassName={mode === "edit" ? "grl-field-edit--output" : undefined}
      mode={mode}
      trigger={trigger}>
      <p className="text-xs mb-0.5">Output Field</p>
      <Input
        ref={input}
        value={innerValue}
        onChange={(e) => setInnerValue(e.target.value)}
        readOnly={disabled}
      />
      {mode === "create" && (
        <div className="mt-3">
          <p className="text-xs mb-0.5">Label</p>
          <Input
            ref={nameInput}
            value={innerName}
            onChange={(e) => setInnerName(e.target.value)}
            placeholder="Field label"
            disabled={disabled}
          />
        </div>
      )}
      {showAdvanced && (
        <div className="mt-4">
          <p className="text-xs mb-1">Type</p>
          <FieldTypeTags
            options={OUTPUT_FIELD_TYPE_OPTIONS}
            value={innerFieldType}
            onChange={setInnerFieldType}
            disabled={disabled}
          />
        </div>
      )}
      {showAdvanced && supportsEnum && (
        <div className="mt-3">
          <p className="text-xs mb-1">Enum</p>
          <FieldTypeTags
            options={
              Object.keys(dictionaries).length
                ? ENUM_MODE_OPTIONS
                : ENUM_MODE_OPTIONS.filter((o) => o.value !== "ref")
            }
            value={enumMode}
            onChange={setEnumMode}
            disabled={disabled}
          />
          {enumMode === "inline" && (
            <div className="mt-2">
              <AutosizeTextArea
                maxRows={6}
                placeholder={"United States;us\nCanada;ca\nMexico"}
                value={enumText}
                onChange={(e) => setEnumText(e.target.value)}
                disabled={disabled}
                style={{ fontSize: 12 }}
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">
                One per line. Use {'"Label;value"'} format.
              </p>
            </div>
          )}
          {enumMode === "ref" && (
            <div className="mt-2">
              <Select
                value={enumRef || undefined}
                onValueChange={setEnumRef}
                disabled={disabled}>
                <SelectTrigger className="w-full h-7 text-xs">
                  <SelectValue placeholder="Select dictionary..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(dictionaries).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {enumMode !== "none" && (
            <div className="mt-2 flex items-center gap-2">
              <Checkbox
                id="enum-loose"
                checked={enumLoose}
                onCheckedChange={(v) => setEnumLoose(v === true)}
                disabled={disabled}
              />
              <Label htmlFor="enum-loose" className="text-xs font-normal">
                Allow custom values
              </Label>
            </div>
          )}
        </div>
      )}
    </FieldEditPopover>
  );
};
