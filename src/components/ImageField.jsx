import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";

// Campo para adjuntar una imagen (captura de pantalla, mapa...) sin depender de ningún
// servicio externo: la comprimimos en el propio navegador y la guardamos como base64
// directamente en el registro. Evita subir archivos pesados a la base de datos.
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.72;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageField({ label, value, onChange, disabled }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className="max-h-64 rounded-lg border border-slate-200 object-contain" />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -top-2 -right-2 bg-white border border-slate-300 rounded-full p-1 shadow-sm hover:bg-slate-50"
            >
              <X className="w-3.5 h-3.5 text-slate-600" />
            </button>
          )}
        </div>
      ) : !disabled ? (
        <div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => inputRef.current?.click()}>
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            {loading ? "Procesando..." : "Adjuntar captura"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Sin adjuntar</p>
      )}
    </div>
  );
}
