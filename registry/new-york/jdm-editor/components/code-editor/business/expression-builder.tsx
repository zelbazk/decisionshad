"use client";

import type {
  ExpressionBuilderData,
  SimpleOperator,
  SimpleValue,
} from "@gorules/zen-engine-wasm";
import { ExpressionBuilder as ExpressionBuilderWasm } from "@gorules/zen-engine-wasm";
import {
  ArrowLeftRightIcon,
  AsteriskIcon,
  CalendarCheckIcon,
  CalendarIcon,
  CalendarMinusIcon,
  CalendarPlusIcon,
  CircleDotIcon,
  CircleSlashIcon,
  ClockArrowDownIcon,
  ClockArrowUpIcon,
  EqualIcon,
  EqualNotIcon,
  ListIcon,
  ListXIcon,
  type LucideIcon,
  SearchIcon,
  SquareFunctionIcon,
  TextCursorInputIcon,
  XIcon,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { P, match } from "ts-pattern";

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
import type { ColumnFieldType } from "../../../helpers/schema";
import { type DictionaryMap, useDictionaries } from "../../../theme";
import { useWasmReady } from "../../../helpers/wasm";
import { AutosizeTextArea } from "../../autosize-text-area";
import { CodeEditorBase } from "../ce-base";
import { focusBuilderRoot } from "./focus-helper";

export type ExpressionBuilderProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fieldType?: ColumnFieldType;
  maxRows?: number;
};

type OperatorType = SimpleOperator["type"];
type ValueKind = "string" | "number" | "boolean" | "date" | "any";

const VALUE_KINDS: { kind: ValueKind; label: string }[] = [
  { kind: "string", label: "Text" },
  { kind: "number", label: "Number" },
  { kind: "boolean", label: "Boolean" },
  { kind: "date", label: "Date" },
];

type Op = {
  type: OperatorType;
  icon?: LucideIcon;
  symbol?: string;
  rotate?: boolean;
  label: string;
};

const OPS: Op[] = [
  { type: "eq", icon: EqualIcon, label: "equals" },
  { type: "neq", icon: EqualNotIcon, label: "not equals" },
  { type: "gt", symbol: ">", label: "greater than" },
  { type: "gte", symbol: "≥", label: "greater or equal" },
  { type: "lt", symbol: "<", label: "less than" },
  { type: "lte", symbol: "≤", label: "less or equal" },
  { type: "in", icon: ListIcon, label: "is one of" },
  { type: "notIn", icon: ListXIcon, label: "is not one of" },
  { type: "between", icon: ArrowLeftRightIcon, label: "between" },
  { type: "null", icon: CircleSlashIcon, label: "is empty" },
  { type: "notNull", icon: CircleDotIcon, label: "is not empty" },
  { type: "any", icon: AsteriskIcon, label: "any" },
  { type: "startsWith", icon: TextCursorInputIcon, label: "starts with" },
  {
    type: "endsWith",
    icon: TextCursorInputIcon,
    rotate: true,
    label: "ends with",
  },
  { type: "contains", icon: SearchIcon, label: "contains" },
  { type: "dateAfter", icon: CalendarPlusIcon, label: "after" },
  { type: "dateBefore", icon: CalendarMinusIcon, label: "before" },
  { type: "dateSame", icon: CalendarCheckIcon, label: "same day" },
  { type: "dateSameOrAfter", symbol: "≥", label: "same or after" },
  { type: "dateSameOrBefore", symbol: "≤", label: "same or before" },
  { type: "dateIsToday", icon: CalendarIcon, label: "is today" },
  { type: "timeGt", icon: ClockArrowUpIcon, label: "time after" },
  { type: "timeGte", icon: ClockArrowUpIcon, label: "time at or after" },
  { type: "timeLt", icon: ClockArrowDownIcon, label: "time before" },
  { type: "timeLte", icon: ClockArrowDownIcon, label: "time at or before" },
  { type: "dayOfWeekIn", icon: CalendarIcon, label: "day is one of" },
  { type: "quarterIn", icon: CalendarIcon, label: "quarter is one of" },
];

const getOp = (type: OperatorType): Op =>
  OPS.find((o) => o.type === type) ?? OPS[0];

const OPS_BY_KIND: Record<ValueKind, OperatorType[]> = {
  string: [
    "eq",
    "neq",
    "in",
    "notIn",
    "startsWith",
    "endsWith",
    "contains",
    "null",
    "notNull",
    "any",
  ],
  number: [
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "notIn",
    "between",
    "null",
    "notNull",
    "any",
  ],
  boolean: ["eq", "null", "notNull", "any"],
  date: [
    "dateAfter",
    "dateBefore",
    "dateSame",
    "dateSameOrAfter",
    "dateSameOrBefore",
    "dateIsToday",
    "timeGt",
    "timeGte",
    "timeLt",
    "timeLte",
    "dayOfWeekIn",
    "quarterIn",
    "null",
    "notNull",
    "any",
  ],
  any: OPS.map((o) => o.type),
};

const GRID_OPS: Record<ValueKind, OperatorType[]> = {
  string: ["eq", "neq", "in", "startsWith", "endsWith", "contains"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte"],
  boolean: ["eq", "null", "notNull", "any"],
  date: [
    "dateAfter",
    "dateBefore",
    "dateSame",
    "dateIsToday",
    "dayOfWeekIn",
    "quarterIn",
  ],
  any: ["eq", "neq", "gt", "gte", "lt", "lte"],
};

const NO_VALUE_OPS: OperatorType[] = ["null", "notNull", "any", "dateIsToday"];

const GRANULARITIES = [
  { value: "__exact__", label: "Exact" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

const getValueKind = (ft?: ColumnFieldType): ValueKind =>
  match(ft?.type)
    .with("string", () => "string" as const)
    .with("number", () => "number" as const)
    .with("boolean", () => "boolean" as const)
    .with("date", () => "date" as const)
    .otherwise(() => "any" as const);

const enumFilterOption = (
  input: string,
  option?: { label?: string; value?: string },
) => {
  const search = input.toLowerCase();
  return (
    (option?.label?.toLowerCase().includes(search) ||
      option?.value?.toLowerCase().includes(search)) ??
    false
  );
};

const getEnumOptions = (
  ft?: ColumnFieldType,
  dictionaries?: DictionaryMap,
): { values: { label: string; value: string }[]; loose: boolean } | null => {
  if (ft?.type !== "string" || !ft.enum) return null;
  const e = ft.enum;
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

const defaultValue = (op: OperatorType, kind: ValueKind): SimpleValue | null =>
  match(op)
    .with(
      P.when((o) => NO_VALUE_OPS.includes(o)),
      () => null,
    )
    .with(
      "between",
      () =>
        ({
          type: "interval",
          left: 0,
          right: 100,
          leftInclusive: true,
          rightInclusive: true,
        }) as SimpleValue,
    )
    .with(
      "in",
      "notIn",
      () =>
        (kind === "number"
          ? { type: "numberArray", values: [] }
          : { type: "stringArray", values: [] }) as SimpleValue,
    )
    .with(
      "dateAfter",
      "dateBefore",
      "dateSame",
      "dateSameOrAfter",
      "dateSameOrBefore",
      () =>
        ({
          type: "date",
          value: new Date().toISOString().slice(0, 10),
        }) as SimpleValue,
    )
    .with(
      "timeGt",
      "timeGte",
      "timeLt",
      "timeLte",
      () => ({ type: "time", hour: 9, minute: 0 }) as SimpleValue,
    )
    .with(
      "dayOfWeekIn",
      () => ({ type: "intArray", values: [1, 2, 3, 4, 5] }) as SimpleValue,
    )
    .with("quarterIn", () => ({ type: "intArray", values: [1] }) as SimpleValue)
    .with(
      "startsWith",
      "endsWith",
      "contains",
      () => ({ type: "string", value: "" }) as SimpleValue,
    )
    .otherwise(() =>
      match(kind)
        .with("number", () => ({ type: "number", value: 0 }) as SimpleValue)
        .with(
          "boolean",
          () => ({ type: "boolean", value: true }) as SimpleValue,
        )
        .otherwise(() => ({ type: "string", value: "" }) as SimpleValue),
    );

const OpIcon: React.FC<{ op: Op; size: number; className?: string }> = ({
  op,
  size,
  className,
}) =>
  op.icon ? (
    <op.icon
      size={size}
      className={className}
      style={op.rotate ? { transform: "rotate(180deg)" } : undefined}
    />
  ) : (
    <span className={className} style={{ fontSize: size }}>
      {op.symbol}
    </span>
  );

const inferKindFromExpr = (data: ExpressionBuilderData): ValueKind | null => {
  if (data.kind !== "simple") return null;
  const op = data.operator.type;
  if (
    op.startsWith("date") ||
    op.startsWith("time") ||
    op === "dayOfWeekIn" ||
    op === "quarterIn"
  )
    return "date";
  if (["startsWith", "endsWith", "contains"].includes(op)) return "string";
  const val = data.value;
  if (!val) return null;
  return match(val.type)
    .with("string", "stringArray", () => "string" as const)
    .with("number", "numberArray", "interval", () => "number" as const)
    .with("boolean", () => "boolean" as const)
    .with("date", "time", () => "date" as const)
    .otherwise(() => null);
};

const isExprCompatibleWithKind = (
  data: ExpressionBuilderData,
  kind: ValueKind,
): boolean => {
  if (data.kind !== "simple") return true;
  const op = data.operator.type;
  if (!OPS_BY_KIND[kind].includes(op)) return false;
  if (NO_VALUE_OPS.includes(op)) return true;
  const val = data.value;
  if (!val) return true;
  return match(kind)
    .with("boolean", () => val.type === "boolean")
    .with("number", () =>
      ["number", "numberArray", "interval"].includes(val.type),
    )
    .with("string", () => ["string", "stringArray"].includes(val.type))
    .with("date", () => ["date", "time", "intArray"].includes(val.type))
    .with("any", () => true)
    .exhaustive();
};

const useExpressionState = (value: string, onChange: (v: string) => void) => {
  const wasmReady = useWasmReady();

  const expr = useMemo(() => {
    if (!wasmReady) {
      return {
        kind: "simple" as const,
        operator: { type: "eq" as OperatorType },
        value: null,
      } as ExpressionBuilderData;
    }
    const e = ExpressionBuilderWasm.parseUnary(value);
    const d = e.toJson() as ExpressionBuilderData;
    e.free();
    return d;
  }, [value, wasmReady]);

  const update = useCallback(
    (d: ExpressionBuilderData) => {
      if (!wasmReady) return;
      const e = ExpressionBuilderWasm.fromJson(d);
      onChange(e.serialize());
      e.free();
    },
    [onChange, wasmReady],
  );

  const setVal = useCallback(
    (v: SimpleValue | null) => {
      if (expr.kind === "simple")
        update({ kind: "simple", operator: expr.operator, value: v });
    },
    [expr, update],
  );

  const [isCustom, setIsCustom] = useState(expr.kind === "complex");
  useEffect(() => {
    if (expr.kind === "complex") setIsCustom(true);
  }, [expr.kind]);

  const toggleCustom = useCallback(() => setIsCustom((v) => !v), []);

  return { expr, update, setVal, isCustom, setIsCustom, toggleCustom };
};

export type ExpressionBuilderRef = {
  focus: () => void;
};

export const ExpressionBuilder = React.forwardRef<
  ExpressionBuilderRef,
  ExpressionBuilderProps
>(({ value, onChange, disabled = false, fieldType, maxRows = 3 }, ref) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const dictionaries = useDictionaries();
  const styleVars = { "--b-max-rows": maxRows } as React.CSSProperties;

  useImperativeHandle(ref, () => ({
    focus: () => focusBuilderRoot(rootRef.current),
  }));

  const enumResult = getEnumOptions(fieldType, dictionaries);
  const enumOpts = enumResult?.values ?? null;
  const isLoose = enumResult?.loose ?? false;
  const externalKind = getValueKind(fieldType);
  const isEnum = !!enumOpts?.length;
  const isAutoType = !isEnum && externalKind === "any";
  const { expr, update, setVal, isCustom, setIsCustom, toggleCustom } =
    useExpressionState(value, onChange);
  const [localKind, setLocalKind] = useState<ValueKind | null>(null);
  const kind = isEnum
    ? "string"
    : isAutoType
      ? (localKind ?? inferKindFromExpr(expr) ?? "string")
      : externalKind;
  const forceCustom =
    !isAutoType &&
    expr.kind === "simple" &&
    !isExprCompatibleWithKind(expr, kind);

  const setKind = useCallback(
    (newKind: ValueKind) => {
      setLocalKind(newKind);
      const defaultOp = OPS_BY_KIND[newKind][0];
      update({
        kind: "simple",
        operator: { type: defaultOp } as SimpleOperator,
        value: defaultValue(defaultOp, newKind),
      });
    },
    [update],
  );

  const setOp = useCallback(
    (op: OperatorType) => {
      const cur = expr.kind === "simple" ? expr.value : null;
      const canReuse = (t: string) => cur?.type === t;
      const val = match(op)
        .with(
          P.when((o) => NO_VALUE_OPS.includes(o)),
          () => null,
        )
        .with("between", () =>
          canReuse("interval") ? cur : defaultValue(op, kind),
        )
        .with("in", "notIn", () =>
          canReuse("stringArray") || canReuse("numberArray")
            ? cur
            : defaultValue(op, kind),
        )
        .with(
          "dateAfter",
          "dateBefore",
          "dateSame",
          "dateSameOrAfter",
          "dateSameOrBefore",
          () => (canReuse("date") ? cur : defaultValue(op, kind)),
        )
        .with("timeGt", "timeGte", "timeLt", "timeLte", () =>
          canReuse("time") ? cur : defaultValue(op, kind),
        )
        .with("dayOfWeekIn", "quarterIn", () =>
          canReuse("intArray") ? cur : defaultValue(op, kind),
        )
        .with("startsWith", "endsWith", "contains", () =>
          canReuse("string") ? cur : defaultValue(op, kind),
        )
        .otherwise(() => {
          const expected =
            kind === "number"
              ? "number"
              : kind === "boolean"
                ? "boolean"
                : "string";
          return canReuse(expected) ? cur : defaultValue(op, kind);
        });
      update({
        kind: "simple",
        operator: { type: op } as SimpleOperator,
        value: val,
      });
    },
    [expr, kind, update],
  );

  const handleSelectOp = useCallback(
    (op: OperatorType) => {
      setIsCustom(false);
      setOp(op);
    },
    [setOp, setIsCustom],
  );

  const dropdownProps = {
    kind,
    operator:
      expr.kind === "simple" ? expr.operator.type : ("eq" as OperatorType),
    onSelect: handleSelectOp,
    onKindChange: isAutoType ? setKind : undefined,
    onCustomToggle: toggleCustom,
    disabled,
  };

  if (isCustom || forceCustom || expr.kind === "complex") {
    return (
      <div ref={rootRef} className="eb" style={styleVars}>
        <OpDropdown {...dropdownProps} isCustom />
        <CodeEditorBase
          className="eb-code"
          value={value}
          onChange={onChange}
          type="unary"
          disabled={disabled}
          noStyle
          maxRows={maxRows}
          placeholder="Expression..."
        />
      </div>
    );
  }

  const op = expr.operator.type;
  return (
    <div ref={rootRef} className="eb" style={styleVars}>
      <OpDropdown {...dropdownProps} operator={op} />
      {NO_VALUE_OPS.includes(op) ? (
        op !== "any" && <span className="eb-label">{getOp(op).label}</span>
      ) : isEnum ? (
        <EnumValInput
          value={expr.value}
          onChange={setVal}
          operator={op}
          options={enumOpts}
          loose={isLoose}
          disabled={disabled}
        />
      ) : (
        <ValInput
          value={expr.value}
          onChange={setVal}
          operator={op}
          kind={kind}
          disabled={disabled}
        />
      )}
    </div>
  );
});

ExpressionBuilder.displayName = "ExpressionBuilder";

// ─── Operator dropdown ────────────────────────────────────────────────────────

type OpDropdownProps = {
  kind: ValueKind;
  operator: OperatorType;
  isCustom?: boolean;
  onSelect: (op: OperatorType) => void;
  onKindChange?: (kind: ValueKind) => void;
  onCustomToggle?: () => void;
  disabled?: boolean;
};

const OpDropdown: React.FC<OpDropdownProps> = ({
  kind,
  operator,
  isCustom,
  onSelect,
  onKindChange,
  onCustomToggle,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const grid = GRID_OPS[kind].map(getOp);
  const list = OPS_BY_KIND[kind]
    .filter((t) => !GRID_OPS[kind].includes(t))
    .map(getOp);
  const filtered = list.filter(
    (o) => !search || o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const pick = (t: OperatorType) => {
    onSelect(t);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch("");
      }}>
      <PopoverTrigger asChild>
        <button className={cn("op-trigger", { disabled })} disabled={disabled}>
          {isCustom ? (
            <SquareFunctionIcon size={14} />
          ) : (
            <OpIcon op={getOp(operator)} size={14} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="op-panel p-0 w-auto"
        align="start"
        side="bottom">
        <div>
          {onKindChange && (
            <div className="op-types">
              {VALUE_KINDS.map((t) => (
                <button
                  key={t.kind}
                  className={cn("op-type-btn", { active: t.kind === kind })}
                  onClick={() => onKindChange(t.kind)}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className="op-body">
            <div className="op-grid">
              {grid.map((o) => (
                <button
                  key={o.type}
                  className={cn("op-tile", {
                    active: o.type === operator && !isCustom,
                  })}
                  onClick={() => pick(o.type)}>
                  <OpIcon op={o} size={20} className="op-tile-icon" />
                  <span className="op-tile-label">{o.label}</span>
                </button>
              ))}
              {onCustomToggle && (
                <button
                  className={cn("op-tile", "op-tile-wide", {
                    active: isCustom,
                  })}
                  onClick={() => {
                    onCustomToggle();
                    setOpen(false);
                  }}>
                  <SquareFunctionIcon size={20} className="op-tile-icon" />
                  <span className="op-tile-label">custom</span>
                </button>
              )}
            </div>
            {list.length > 0 && (
              <div className="op-list-section">
                <input
                  className="op-search"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="op-list">
                  {filtered.map((o) => (
                    <button
                      key={o.type}
                      className={cn("op-row", {
                        active: o.type === operator && !isCustom,
                      })}
                      onClick={() => pick(o.type)}>
                      <OpIcon op={o} size={16} className="op-row-icon" />
                      <span className="op-row-label">{o.label}</span>
                    </button>
                  ))}
                  {!filtered.length && (
                    <div className="op-empty">No matches</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ─── Value inputs ─────────────────────────────────────────────────────────────

type ValInputProps = {
  value: SimpleValue | null;
  onChange: (v: SimpleValue | null) => void;
  operator: OperatorType;
  kind: ValueKind;
  disabled?: boolean;
};

const ValInput: React.FC<ValInputProps> = ({
  value,
  onChange,
  operator,
  kind,
  disabled,
}) =>
  match(operator)
    .with("between", () => (
      <IntervalInput value={value} onChange={onChange} disabled={disabled} />
    ))
    .with("in", "notIn", () => (
      <ArrayInput
        value={value}
        onChange={onChange}
        kind={kind}
        disabled={disabled}
      />
    ))
    .with(
      "dateAfter",
      "dateBefore",
      "dateSame",
      "dateSameOrAfter",
      "dateSameOrBefore",
      () => <DateInput value={value} onChange={onChange} disabled={disabled} />,
    )
    .with("timeGt", "timeGte", "timeLt", "timeLte", () => (
      <TimeInput value={value} onChange={onChange} disabled={disabled} />
    ))
    .with("dayOfWeekIn", () => (
      <ChipInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={DAYS}
        defaultValues={[1, 2, 3, 4, 5]}
      />
    ))
    .with("quarterIn", () => (
      <ChipInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={QUARTERS}
        defaultValues={[1]}
      />
    ))
    .otherwise(() =>
      match(kind)
        .with("boolean", () => (
          <BoolInput value={value} onChange={onChange} disabled={disabled} />
        ))
        .with("number", () => (
          <NumInput value={value} onChange={onChange} disabled={disabled} />
        ))
        .otherwise(() => (
          <StrInput value={value} onChange={onChange} disabled={disabled} />
        )),
    );

type SimpleInputProps = {
  value: SimpleValue | null;
  onChange: (v: SimpleValue) => void;
  disabled?: boolean;
};

const StrInput: React.FC<SimpleInputProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const externalText = value?.type === "string" ? value.value : "";
  const [text, setText] = useState(externalText);
  useEffect(() => {
    if (text !== externalText) setText(externalText);
  }, [externalText]);
  const commit = () => onChange({ type: "string", value: text });
  return (
    <AutosizeTextArea
      className="eb-input"
      value={text}
      maxRows={3}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && commit()}
      disabled={disabled}
    />
  );
};

const NumInput: React.FC<SimpleInputProps> = ({
  value,
  onChange,
  disabled,
}) => (
  <input
    type="number"
    className="eb-number"
    value={value?.type === "number" ? value.value : 0}
    onChange={(e) => {
      const n = parseFloat(e.target.value);
      if (!isNaN(n)) onChange({ type: "number", value: n });
    }}
    disabled={disabled}
  />
);

const BoolInput: React.FC<SimpleInputProps> = ({
  value,
  onChange,
  disabled,
}) => (
  <Select
    value={String(value?.type === "boolean" ? value.value : true)}
    onValueChange={(v) => onChange({ type: "boolean", value: v === "true" })}
    disabled={disabled}>
    <SelectTrigger className="eb-select">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="true">true</SelectItem>
      <SelectItem value="false">false</SelectItem>
    </SelectContent>
  </Select>
);

const DateInput: React.FC<SimpleInputProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const dateVal =
    value?.type === "date"
      ? value.value
      : new Date().toISOString().slice(0, 10);
  const granularity =
    value?.type === "date" ? (value.granularity ?? "__exact__") : "__exact__";
  return (
    <>
      <input
        type="date"
        className="eb-date"
        value={dateVal}
        onChange={(e) =>
          e.target.value &&
          onChange({
            type: "date",
            value: e.target.value,
            granularity: granularity === "__exact__" ? undefined : granularity,
          })
        }
        disabled={disabled}
      />
      <Select
        value={granularity}
        onValueChange={(g) =>
          onChange({
            type: "date",
            value: dateVal,
            granularity: g === "__exact__" ? undefined : g,
          })
        }
        disabled={disabled}>
        <SelectTrigger className="eb-granularity">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRANULARITIES.map((g) => (
            <SelectItem key={g.value} value={g.value}>
              {g.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

const TimeInput: React.FC<SimpleInputProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const timeStr =
    value?.type === "time"
      ? `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`
      : "09:00";
  return (
    <input
      type="time"
      className="eb-time"
      value={timeStr}
      onChange={(e) => {
        const [h, m] = e.target.value.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m))
          onChange({ type: "time", hour: h, minute: m });
      }}
      disabled={disabled}
    />
  );
};

const DAYS = [
  { v: 1, l: "Mon" },
  { v: 2, l: "Tue" },
  { v: 3, l: "Wed" },
  { v: 4, l: "Thu" },
  { v: 5, l: "Fri" },
  { v: 6, l: "Sat" },
  { v: 7, l: "Sun" },
];
const QUARTERS = [
  { v: 1, l: "Q1" },
  { v: 2, l: "Q2" },
  { v: 3, l: "Q3" },
  { v: 4, l: "Q4" },
];

const ChipInput: React.FC<
  SimpleInputProps & {
    options: { v: number; l: string }[];
    defaultValues: number[];
  }
> = ({ value, onChange, disabled, options, defaultValues }) => {
  const valid = new Set(options.map((o) => o.v));
  const raw = value?.type === "intArray" ? value.values : defaultValues;
  const sel = raw.filter((v) => valid.has(v));

  useEffect(() => {
    if (sel.length !== raw.length && sel.length > 0)
      onChange({ type: "intArray", values: sel });
  }, [sel.length, raw.length]);

  const toggle = (v: number) => {
    if (disabled) return;
    const next = sel.includes(v)
      ? sel.filter((x) => x !== v)
      : [...sel, v].sort((a, b) => a - b);
    if (next.length) onChange({ type: "intArray", values: next });
  };
  return (
    <div className="eb-chips">
      {options.map((o) => (
        <span
          key={o.v}
          className={cn("eb-chip", { active: sel.includes(o.v), disabled })}
          onClick={() => toggle(o.v)}>
          {o.l}
        </span>
      ))}
    </div>
  );
};

// ─── Tags input (replaces antd Select mode='tags'/'multiple') ─────────────────

type TagsInputProps = {
  value: string[];
  onChange: (v: string[]) => void;
  options?: { label: string; value: string }[];
  freeInput?: boolean;
  maxCount?: number;
  disabled?: boolean;
  className?: string;
  filterOption?: (
    input: string,
    option?: { label?: string; value?: string },
  ) => boolean;
  tokenSeparators?: string[];
};

const TagsInput: React.FC<TagsInputProps> = ({
  value,
  onChange,
  options = [],
  freeInput = true,
  maxCount,
  disabled,
  className,
  filterOption,
  tokenSeparators = [","],
}) => {
  const [search, setSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(
    () =>
      options.filter(
        (o) =>
          !value.includes(o.value) &&
          (!search ||
            (filterOption
              ? filterOption(search, o)
              : o.label.toLowerCase().includes(search.toLowerCase()) ||
                o.value.toLowerCase().includes(search.toLowerCase()))),
      ),
    [options, value, search, filterOption],
  );

  const optionLabel = useMemo(() => {
    const m = new Map(options.map((o) => [o.value, o.label]));
    return (v: string) => m.get(v) ?? v;
  }, [options]);

  const add = (v: string) => {
    if (!v.trim() || value.includes(v)) return;
    const next =
      maxCount !== undefined && value.length >= maxCount ? [v] : [...value, v];
    onChange(next);
    setSearch("");
    setDropOpen(false);
  };

  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !search && value.length > 0) {
      remove(value[value.length - 1]);
    } else if (e.key === "Enter" && search.trim() && freeInput) {
      e.preventDefault();
      add(search.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    for (const sep of tokenSeparators) {
      if (v.endsWith(sep)) {
        const trimmed = v.slice(0, -sep.length).trim();
        if (trimmed && freeInput) {
          add(trimmed);
          return;
        }
        v = v.slice(0, -sep.length);
        break;
      }
    }
    setSearch(v);
    setDropOpen(true);
  };

  const isAtMax = maxCount !== undefined && value.length >= maxCount;

  return (
    <div
      className={cn(
        "relative flex flex-wrap gap-1 items-center min-h-6 cursor-text",
        className,
      )}
      onClick={() => !disabled && inputRef.current?.focus()}>
      {value.map((v) => (
        <span key={v} className="eb-chip active">
          {optionLabel(v)}
          {!disabled && (
            <button
              type="button"
              className="ml-1 opacity-60 hover:opacity-100 inline-flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                remove(v);
              }}>
              <XIcon size={10} />
            </button>
          )}
        </span>
      ))}
      {!isAtMax && !disabled && (
        <>
          <input
            ref={inputRef}
            className="flex-1 min-w-10 outline-none bg-transparent text-sm caret-foreground"
            value={search}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setDropOpen(true)}
            onBlur={() => setTimeout(() => setDropOpen(false), 150)}
          />
          {dropOpen && filteredOptions.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-30 rounded-md border border-border bg-popover shadow-md p-1">
              {filteredOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(o.value);
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ArrayInput: React.FC<SimpleInputProps & { kind: ValueKind }> = ({
  value,
  onChange,
  kind,
  disabled,
}) => {
  const vals = useMemo(
    () =>
      value?.type === "stringArray"
        ? value.values
        : value?.type === "numberArray"
          ? value.values.map(String)
          : [],
    [value],
  );
  return (
    <TagsInput
      className="eb-tags"
      value={vals}
      onChange={(v) =>
        kind === "number"
          ? onChange({
              type: "numberArray",
              values: v.map((x) => parseFloat(x)).filter((n) => !isNaN(n)),
            })
          : onChange({ type: "stringArray", values: v })
      }
      disabled={disabled}
      freeInput
      tokenSeparators={[","]}
    />
  );
};

const IntervalInput: React.FC<SimpleInputProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const iv =
    value?.type === "interval"
      ? value
      : { left: 0, right: 100, leftInclusive: true, rightInclusive: true };
  const upd = (p: Partial<typeof iv>) =>
    onChange({ type: "interval", ...iv, ...p });
  return (
    <div className="eb-interval">
      <span
        className="eb-bracket"
        onClick={() => !disabled && upd({ leftInclusive: !iv.leftInclusive })}>
        {iv.leftInclusive ? "[" : "("}
      </span>
      <input
        type="number"
        className="eb-interval-num"
        value={iv.left}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) upd({ left: n });
        }}
        disabled={disabled}
      />
      <span className="text-muted-foreground">..</span>
      <input
        type="number"
        className="eb-interval-num"
        value={iv.right}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) upd({ right: n });
        }}
        disabled={disabled}
      />
      <span
        className="eb-bracket"
        onClick={() =>
          !disabled && upd({ rightInclusive: !iv.rightInclusive })
        }>
        {iv.rightInclusive ? "]" : ")"}
      </span>
    </div>
  );
};

const EnumValInput: React.FC<{
  value: SimpleValue | null;
  onChange: (v: SimpleValue) => void;
  operator: OperatorType;
  options: { label: string; value: string }[];
  loose?: boolean;
  disabled?: boolean;
}> = ({ value, onChange, operator, options, loose, disabled }) =>
  match(operator)
    .with("in", "notIn", () => (
      <TagsInput
        className="eb-enum"
        value={value?.type === "stringArray" ? value.values : []}
        onChange={(v) => onChange({ type: "stringArray", values: v })}
        options={options}
        freeInput={!!loose}
        disabled={disabled}
        filterOption={enumFilterOption}
        tokenSeparators={[","]}
      />
    ))
    .with("eq", "neq", () =>
      loose ? (
        <TagsInput
          className="eb-enum"
          value={value?.type === "string" && value.value ? [value.value] : []}
          onChange={(v) => onChange({ type: "string", value: v[0] ?? "" })}
          options={options}
          freeInput
          maxCount={1}
          disabled={disabled}
          filterOption={enumFilterOption}
        />
      ) : (
        <Select
          value={value?.type === "string" ? value.value : undefined}
          onValueChange={(v) => onChange({ type: "string", value: v })}
          disabled={disabled}>
          <SelectTrigger className="eb-enum">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    )
    .otherwise(() => (
      <StrInput value={value} onChange={onChange} disabled={disabled} />
    ));
