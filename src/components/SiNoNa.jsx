import React from "react";
import { cn } from "@/lib/utils";

// Control tipo "casillas de papel" para Sí / No / N/A, usado en las listas de
// verificación del Plan de Vuelo Operacional.
export default function SiNoNa({ value, onChange, disabled }) {
  const options = [
    { value: "si", label: "Sí" },
    { value: "no", label: "No" },
    { value: "na", label: "N/A" },
  ];
  return (
    <div className="flex gap-1 shrink-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors",
            value === opt.value
              ? opt.value === "si"
                ? "bg-green-600 text-white border-green-600"
                : opt.value === "no"
                ? "bg-red-600 text-white border-red-600"
                : "bg-slate-500 text-white border-slate-500"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
