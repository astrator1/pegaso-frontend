import React from "react";
import { cn } from "@/lib/utils";

// Control tipo "casillas de papel" para Sí / No / N/A, usado en las listas de
// verificación del Plan de Vuelo Operacional.
//
// Los botones se ocultan al imprimir (como todos los <button> de la app), así que
// añadimos un texto fijo en su lugar que solo se ve en la impresión (clase print:inline-flex),
// para que la casilla marcada quede reflejada en el papel.
export default function SiNoNa({ value, onChange, disabled }) {
  const options = [
    { value: "si", label: "Sí" },
    { value: "no", label: "No" },
    { value: "na", label: "N/A" },
  ];
  const selected = options.find((o) => o.value === value);

  return (
    <div className="shrink-0">
      <div className="flex gap-1 no-print">
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
      <span
        className={cn(
          "hidden print:inline-block px-2 py-0.5 text-xs font-semibold border rounded",
          selected?.value === "si" && "border-green-700 text-green-800",
          selected?.value === "no" && "border-red-700 text-red-800",
          (!selected || selected?.value === "na") && "border-slate-500 text-slate-700"
        )}
      >
        {selected ? selected.label : "N/A"}
      </span>
    </div>
  );
}
