"use client";

import { useState } from "react";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  required = false,
  minLength,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange(value: string): void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-2">
        <input
          className="w-full pr-20"
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
        />
        <button
          className="absolute inset-y-0 right-2 my-1 rounded px-2 text-xs font-semibold text-accent hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
