import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 

export const isIframe = window.self !== window.top;

// Compara dos valores tratando los números que contienen como números, no como texto
// (para que "2" vaya antes que "10", en vez del orden alfabético 10, 11, 2, 20...).
export function naturalCompare(a, b) {
  const sa = a === undefined || a === null ? "" : String(a);
  const sb = b === undefined || b === null ? "" : String(b);
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
}
