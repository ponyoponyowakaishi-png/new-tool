"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { parseNonNegativeFloat, parseNonNegativeInt } from "@/lib/parse";

type NumberFieldProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  integer?: boolean;
};

function formatStoredValue(value: number | null): string {
  return value === null ? "" : String(value);
}

function parseDraft(value: string, integer: boolean): number | null {
  return integer ? parseNonNegativeInt(value) : parseNonNegativeFloat(value);
}

/** 入力中はローカル文字列を保持し、確定時（blur）に数値へ反映する */
export function NumberField({
  value,
  onValueChange,
  integer = false,
  onBlur,
  onFocus,
  ...props
}: NumberFieldProps) {
  const [draft, setDraft] = useState(() => formatStoredValue(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatStoredValue(value));
    }
  }, [value, focused]);

  const commit = (raw: string) => {
    onValueChange(parseDraft(raw, integer));
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      value={draft}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        commit(draft);
        setDraft(formatStoredValue(parseDraft(draft, integer)));
        onBlur?.(event);
      }}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        if (next.trim() === "" || next.endsWith(".") || next.endsWith(",")) {
          return;
        }
        const parsed = parseDraft(next, integer);
        if (parsed !== null) {
          onValueChange(parsed);
        }
      }}
    />
  );
}
