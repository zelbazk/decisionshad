import { cn } from "@/lib/utils";

export type FieldTypeTagsProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export const FieldTypeTags = <T extends string>({
  options,
  value,
  onChange,
  disabled,
}: FieldTypeTagsProps<T>): React.ReactElement => (
  <div className='grl-field-type-tags'>
    {options.map((opt) => (
      <button
        key={opt.value}
        type='button'
        className={cn('grl-field-type-tag', { active: value === opt.value })}
        onClick={() => !disabled && onChange(opt.value)}
        disabled={disabled}
      >
        {opt.label}
      </button>
    ))}
  </div>
);