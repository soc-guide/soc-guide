import { useMemo, useState } from "react";
import { ImageWithFallback } from "./ImageWithFallback";

export interface SelectOption {
  value: string;
  label?: string;
  icon?: string;
  symbol?: string;
}

interface Props {
  label: string;
  fallbackLabel: string;
  options: SelectOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  ariaLabel?: string;
}

export function MultiSelect({ label, fallbackLabel, options, selected, onChange, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const byValue = useMemo(() => new Map(options.map((item) => [item.value, item])), [options]);
  const selectedItems = [...selected].map((value) => byValue.get(value) ?? { value, label: value });

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  return (
    <div className="filter-field">
      <span>{label}</span>
      <div className={`multi-select ${open ? "is-open" : ""}`}>
        <button className="multi-select-summary" type="button" aria-expanded={open} aria-label={ariaLabel ?? label} onClick={() => setOpen((value) => !value)}>
          <span className="filter-summary-content">
            {!selectedItems.length ? fallbackLabel : selectedItems.length === 1 ? (
              <>
                <OptionSymbol option={selectedItems[0]!} className="summary-symbol" />
                <span>{selectedItems[0]!.label ?? selectedItems[0]!.value}</span>
              </>
            ) : (
              <>
                <span className="summary-symbol-stack">
                  {selectedItems.slice(0, 3).map((item) => <OptionSymbol key={item.value} option={item} className="summary-symbol" />)}
                </span>
                <span>{selectedItems.length} selected</span>
              </>
            )}
          </span>
          <span className="filter-chevron" aria-hidden="true">⌄</span>
        </button>
        {open && (
          <div className="multi-select-menu" role="group" aria-label={ariaLabel ?? label}>
            {options.map((option) => (
              <label className="multi-option" key={option.value}>
                <input type="checkbox" checked={selected.has(option.value)} onChange={() => toggle(option.value)} />
                <OptionSymbol option={option} />
                <span className="option-name">{option.label ?? option.value}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OptionSymbol({ option, className = "option-symbol" }: { option: SelectOption; className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      {option.icon ? <ImageWithFallback src={option.icon} alt="" label={option.label ?? option.value} /> : (option.symbol ?? "◇")}
    </span>
  );
}
