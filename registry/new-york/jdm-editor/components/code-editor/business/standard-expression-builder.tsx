"use client";

import {
  type StandardExpressionData,
  parseStandardExpression,
} from "@gorules/zen-engine-wasm";
import dayjs from "dayjs";
import {
  CalendarIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  HashIcon,
  ListIcon,
  type LucideIcon,
  SquareFunctionIcon,
  ToggleLeftIcon,
  TypeIcon,
  XIcon,
} from "lucide-react";
import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ColumnEnum, OutputFieldType } from "../../../helpers/schema";
import { type DictionaryMap, useDictionaries } from "../../../theme";
import { useWasmReady } from "../../../helpers/wasm";
import { AutosizeTextArea } from "../../autosize-text-area";
import { CodeEditorBase } from "../ce-base";
import { focusBuilderRoot } from "./focus-helper";
import "./standard-expression-builder.css";

export type { OutputFieldType };

export type StandardExpressionBuilderProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fieldType?: OutputFieldType;
  maxRows?: number;
};

const TYPE_ICONS: Record<
  Exclude<OutputFieldType["type"], "auto">,
  LucideIcon
> = {
  string: TypeIcon,
  "string-array": ListIcon,
  number: HashIcon,
  boolean: ToggleLeftIcon,
  date: CalendarIcon,
};

const formatDateValue = (date: string): string => `d('${date}')`;
const formatStringValue = (value: string): string => `"${value}"`;
const formatStringArrayValue = (values: string[]): string =>
  !values.length
    ? "[]"
    : `[${values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(", ")}]`;

const parseStringArrayValue = (value: string): string[] => {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return [];
};

const isStringArrayValue = (value: string): boolean => {
  if (!value?.trim() || value.trim() === "[]") return true;
  try {
    return Array.isArray(JSON.parse(value));
  } catch {}
  return false;
};

const getEnumOptions = (
  ft?: OutputFieldType,
  dictionaries?: DictionaryMap,
): { values: { label: string; value: string }[]; loose: boolean } | null => {
  if (!ft) return null;
  if (ft.type !== "string" && ft.type !== "string-array") return null;
  const e: ColumnEnum | undefined = ft.enum;
  if (!e) return null;
  if (e.type === "inline") {
    return e.values.length
      ? { values: e.values, loose: e.loose ?? false }
      : null;
  }
  const resolved = dictionaries?.[e.ref];
  return resolved?.length
    ? { values: resolved, loose: e.loose ?? false }
    : null;
};

export type StandardExpressionBuilderRef = {
  focus: () => void;
};

// ── Combobox (string + enum, single-select with search) ──────────────────────

type EnumOption = { label: string; value: string };

type ComboboxProps = {
  value: string;
  onChange: (v: string) => void;
  options: EnumOption[];
  disabled?: boolean;
};

const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  options,
  disabled,
}) => {
  const [open, setOpen] = useState(false);

  const filter = (itemValue: string, search: string) => {
    const opt = options.find((o) => o.value === itemValue);
    const text = `${opt?.label ?? ""} ${itemValue}`.toLowerCase();
    return text.includes(search.toLowerCase()) ? 1 : 0;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "seb-select",
            disabled && "opacity-50 pointer-events-none",
          )}
          disabled={disabled}>
          <span>{options.find((o) => o.value === value)?.label ?? value}</span>
          <ChevronsUpDownIcon size={12} className="shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="seb-select-popup p-0" align="start">
        <Command filter={filter}>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                  }}>
                  <CheckIcon
                    className={cn(
                      "mr-2 size-3",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// ── MultiCombobox (string-array + strict enum) ────────────────────────────────

type MultiComboboxProps = {
  values: string[];
  onChange: (v: string[]) => void;
  options: EnumOption[];
  disabled?: boolean;
};

const MultiCombobox: React.FC<MultiComboboxProps> = ({
  values,
  onChange,
  options,
  disabled,
}) => {
  const [open, setOpen] = useState(false);

  const toggle = (v: string) =>
    onChange(
      values.includes(v) ? values.filter((x) => x !== v) : [...values, v],
    );

  const filter = (itemValue: string, search: string) => {
    const opt = options.find((o) => o.value === itemValue);
    const text = `${opt?.label ?? ""} ${itemValue}`.toLowerCase();
    return text.includes(search.toLowerCase()) ? 1 : 0;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "seb-select-multi",
            disabled && "opacity-50 pointer-events-none",
          )}
          disabled={disabled}>
          {values.length === 0 ? (
            <span className="opacity-40">Select...</span>
          ) : (
            <span className="seb-tags-display">
              {values.map((v) => (
                <span key={v} className="seb-tag">
                  {options.find((o) => o.value === v)?.label ?? v}
                </span>
              ))}
            </span>
          )}
          <ChevronsUpDownIcon size={12} className="shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="seb-select-popup p-0" align="start">
        <Command filter={filter}>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => toggle(opt.value)}>
                  <CheckIcon
                    className={cn(
                      "mr-2 size-3",
                      values.includes(opt.value) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// ── TagsInput (string-array + loose or no enum) ───────────────────────────────

type TagsInputProps = {
  values: string[];
  onChange: (v: string[]) => void;
  suggestions?: EnumOption[];
  disabled?: boolean;
};

const TagsInput: React.FC<TagsInputProps> = ({
  values,
  onChange,
  suggestions,
  disabled,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue("");
    setOpen(false);
  };

  const removeTag = (tag: string) => onChange(values.filter((v) => v !== tag));

  const filteredSuggestions = suggestions?.filter(
    (s) =>
      !values.includes(s.value) &&
      (s.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        s.value.toLowerCase().includes(inputValue.toLowerCase())),
  );

  const hasSuggestions = !!filteredSuggestions?.length;

  return (
    <div
      className={cn(
        "seb-select-multi",
        disabled && "opacity-50 pointer-events-none",
      )}
      onClick={() => inputRef.current?.focus()}>
      <div className="seb-tags-display">
        {values.map((v) => (
          <span key={v} className="seb-tag">
            {v}
            {!disabled && (
              <button
                className="seb-tag-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(v);
                }}>
                <XIcon size={10} />
              </button>
            )}
          </span>
        ))}
        <Popover
          open={open && hasSuggestions}
          onOpenChange={(o) => !o && setOpen(false)}>
          <PopoverTrigger asChild>
            <input
              ref={inputRef}
              className="seb-tags-input"
              value={inputValue}
              disabled={disabled}
              onChange={(e) => {
                setInputValue(e.target.value);
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
                  e.preventDefault();
                  addTag(inputValue);
                } else if (
                  e.key === "Backspace" &&
                  !inputValue &&
                  values.length
                ) {
                  removeTag(values[values.length - 1]);
                }
              }}
              placeholder={values.length === 0 ? "Type & press Enter…" : ""}
            />
          </PopoverTrigger>
          {hasSuggestions && (
            <PopoverContent className="seb-select-popup p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {filteredSuggestions!.map((s) => (
                      <CommandItem
                        key={s.value}
                        value={s.value}
                        onSelect={() => addTag(s.value)}>
                        {s.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
      </div>
    </div>
  );
};

// ── SebDatePicker ─────────────────────────────────────────────────────────────

type SebDatePickerProps = {
  value: string | null;
  onChange: (date: string) => void;
  disabled?: boolean;
};

const SebDatePicker: React.FC<SebDatePickerProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const dateValue =
    value && dayjs(value).isValid() ? dayjs(value).toDate() : dayjs().toDate();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="seb-date"
          disabled={disabled}>
          <CalendarIcon size={12} />
          {value && dayjs(value).isValid()
            ? dayjs(value).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(d) => {
            if (d) {
              onChange(dayjs(d).format("YYYY-MM-DD"));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const StandardExpressionBuilder = React.forwardRef<
  StandardExpressionBuilderRef,
  StandardExpressionBuilderProps
>(({ value, onChange, disabled = false, fieldType, maxRows = 3 }, ref) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const dictionaries = useDictionaries();
  const wasmReady = useWasmReady();
  const ftType = fieldType?.type ?? "auto";
  const styleVars = { "--b-max-rows": maxRows } as React.CSSProperties;

  useImperativeHandle(ref, () => ({
    focus: () => focusBuilderRoot(rootRef.current),
  }));

  const parsed = useMemo<StandardExpressionData>(() => {
    if (!wasmReady) return { kind: "expression" } as StandardExpressionData;
    return parseStandardExpression(value);
  }, [value, wasmReady]);

  const computeExprMode = () => {
    if (ftType === "string-array") return !isStringArrayValue(value);
    if (parsed.kind === "expression") return true;
    if (ftType === "auto") return false;
    return parsed.kind !== ftType;
  };

  const [isExprMode, setIsExprMode] = useState(computeExprMode);

  useEffect(() => {
    setIsExprMode(computeExprMode());
  }, [ftType, wasmReady]);

  const forceExprMode =
    ftType !== "auto" &&
    ftType !== "string-array" &&
    parsed.kind !== "expression" &&
    parsed.kind !== ftType;

  const TypeIcon = ftType !== "auto" ? TYPE_ICONS[ftType] : null;
  const enumOptions = getEnumOptions(fieldType, dictionaries);

  if (ftType === "auto" || isExprMode || forceExprMode) {
    return (
      <div ref={rootRef} className="seb" style={styleVars}>
        {ftType !== "auto" && (
          <button
            className="seb-mode-btn"
            onClick={() => {
              if (parsed.kind !== ftType) {
                const t = ftType;
                if (t === "string") onChange(formatStringValue(""));
                else if (t === "number") onChange("0");
                else if (t === "boolean") onChange("true");
                else if (t === "date")
                  onChange(formatDateValue(dayjs().format("YYYY-MM-DD")));
              }
              setIsExprMode(false);
            }}
            disabled={disabled}
            title="Currently: Expression. Click for value mode.">
            <SquareFunctionIcon size={14} />
          </button>
        )}
        <CodeEditorBase
          className="seb-code"
          value={value}
          onChange={onChange}
          type="standard"
          disabled={disabled}
          noStyle
          maxRows={maxRows}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="seb" style={styleVars}>
      <button
        className="seb-mode-btn"
        onClick={() => setIsExprMode(true)}
        disabled={disabled}
        title="Currently: Value. Click for expression mode.">
        {TypeIcon && <TypeIcon size={14} />}
      </button>

      {ftType === "string" && !enumOptions && (
        <AutosizeTextArea
          className="seb-input"
          value={parsed.kind === "string" ? parsed.value : ""}
          maxRows={maxRows}
          onChange={(e) =>
            onChange(
              formatStringValue(
                (e.target as unknown as { value: string }).value,
              ),
            )
          }
          disabled={disabled}
        />
      )}

      {ftType === "string" && enumOptions && (
        <Combobox
          value={parsed.kind === "string" ? parsed.value : ""}
          onChange={(v) => onChange(formatStringValue(v))}
          options={enumOptions.values}
          disabled={disabled}
        />
      )}

      {ftType === "string-array" && enumOptions && !enumOptions.loose && (
        <MultiCombobox
          values={parseStringArrayValue(value)}
          onChange={(v) => onChange(formatStringArrayValue(v))}
          options={enumOptions.values}
          disabled={disabled}
        />
      )}

      {ftType === "string-array" && (!enumOptions || enumOptions.loose) && (
        <TagsInput
          values={parseStringArrayValue(value)}
          onChange={(v) => onChange(formatStringArrayValue(v))}
          suggestions={enumOptions?.values}
          disabled={disabled}
        />
      )}

      {ftType === "number" && (
        <Input
          className="seb-number"
          type="number"
          value={parsed.kind === "number" ? String(parsed.value) : "0"}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}

      {ftType === "boolean" && (
        <Select
          value={String(parsed.kind === "boolean" ? parsed.value : true)}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}>
          <SelectTrigger className="seb-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      )}

      {ftType === "date" && (
        <SebDatePicker
          value={parsed.kind === "date" ? parsed.value : null}
          onChange={(d) => onChange(formatDateValue(d))}
          disabled={disabled}
        />
      )}
    </div>
  );
});

StandardExpressionBuilder.displayName = "StandardExpressionBuilder";
