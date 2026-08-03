import db from "@/api/base44Client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ROW_COUNT = 100;
const emptyRow = () => ({ matricula: "", fecha: "", piloto: "", mision: "", lugar: "", bateria: "", hora_despegue: "", hora_aterrizaje: "" });
const inputClass = "w-full bg-transparent text-sm px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-600 rounded";
const normDate = (d) => {
  if (!d) return "";
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
  const m2 = d.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m2) return m2[3] + "-" + m2[2].padStart(2, "0") + "-" + m2[1].padStart(2, "0");
  return d.trim();
};

const BulkTableBody = React.memo(function BulkTableBody({ rows, handleBlur }) {
  return (
    <tbody>
      {rows.map((r, idx) => (
        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
          <td className="py-1 px-2 text-slate-400 text-xs">{idx + 1}</td>
          <td className="py-1 px-1"><input list="dl-matricula" className={inputClass} defaultValue={r.matricula} onChange={(e) => { r.matricula = e.target.value; }} onBlur={handleBlur} /></td>
          <td className="py-1 px-1"><input type="date" className={inputClass} defaultValue={r.fecha} onChange={(e) => { r.fecha = e.target.value; }} onBlur={handleBlur} /></td>
          <td className="py-1 px-1"><input list="dl-piloto" className={inputClass} defaultValue={r.piloto} onChange={(e) => { r.piloto = e.target.value; }} /></td>
          <td className="py-1 px-1"><input list="dl-mision" className={inputClass} defaultValue={r.mision} onChange={(e) => { r.mision = e.target.value; }} /></td>
          <td className="py-1 px-1"><input className={inputClass} defaultValue={r.lugar} onChange={(e) => { r.lugar = e.target.value; }} /></td>
          <td className="py-1 px-1"><input list="dl-bateria" className={inputClass} defaultValue={r.bateria} onChange={(e) => { r.bateria = e.target.value; }} /></td>
          <td className="py-1 px-1"><input type="time" className={inputClass} defaultValue={r.hora_despegue} onChange={(e) => { r.hora_despegue = e.target.value; }} /></td>
          <td className="py-1 px-1"><input type="time" className={inputClass} defaultValue={r.hora_aterrizaje} onChange={(e) => { r.hora_aterrizaje = e.target.value; }} /></td>
        </tr>
      ))}
    </tbody>
  );
});

export default function VueloBulkForm({ open, onOpenChange, onSaved }) {
  const rowsRef = useRef(Array.from({ length: ROW_COUNT }, emptyRow));
  const [version, setVersion] = useState(0);
  const [aeronaves, setAeronaves] = useState([]);
  const [pilotos, setPilotos] = useState([]);
  const [baterias, setBaterias] = useState([]);
  const [misiones, setMisiones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [validCount, setValidCount] = useState(0);
  const [pasteText, setPasteText] = useState("");

  useEffect(() => {
    if (open) {
      rowsRef.current = Array.from({ length: ROW_COUNT }, emptyRow);
      setVersion(v => v + 1);
      setValidCount(0);
    }
  }, [open]);

  useEffect(() => {
    (async () => {
      try {
        const [a, p, b, m] = await Promise.all([
          db.entities.Aeronave.list(),
          db.entities.Piloto.list(),
          db.entities.Bateria.list(),
          db.entities.Mision.list("nombre", 200),
        ]);
        setAeronaves(a); setPilotos(p); setBaterias(b); setMisiones(m);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const parsePaste = () => {
    const lines = pasteText.trim().split(/\n/).filter(l => l.trim());
    if (lines.length === 0) return;
    const newRows = Array.from({ length: ROW_COUNT }, emptyRow);
    lines.slice(0, ROW_COUNT).forEach((line, i) => {
      const cols = line.includes("\t") ? line.split("\t") : line.includes(";") ? line.split(";") : line.split(",");
      newRows[i] = {
        matricula: cols[0]?.trim() || "",
        fecha: normDate(cols[1]),
        piloto: cols[2]?.trim() || "",
        mision: cols[3]?.trim() || "",
        lugar: cols[4]?.trim() || "",
        bateria: cols[5]?.trim() || "",
        hora_despegue: cols[6]?.trim() || "",
        hora_aterrizaje: cols[7]?.trim() || "",
      };
    });
    rowsRef.current = newRows;
    setVersion(v => v + 1);
    setValidCount(newRows.filter(r => r.matricula && r.fecha).length);
    setPasteText("");
  };

  const handleBlur = useCallback(() => {
    const valid = rowsRef.current.filter(r => r.matricula && r.fecha).length;
    setValidCount(valid);
  }, []);

  const save = async () => {
    const toCreate = rowsRef.current
      .filter((r) => r.matricula && r.fecha)
      .map(({ matricula, fecha, piloto, mision, lugar, bateria, hora_despegue, hora_aterrizaje }) => {
        const pilotoObj = pilotos.find((p) => `${p.nombre} ${p.apellidos || ""}`.trim() === piloto);
        return { matricula, fecha, piloto, mision, lugar, bateria, hora_despegue, hora_aterrizaje, tip_piloto: pilotoObj?.tip || "", pre_vuelo: false, pos_vuelo: false, observaciones: "", firma: "" };
      });
    if (toCreate.length === 0) return;
    setSaving(true);
    try {
      await db.entities.Vuelo.bulkCreate(toCreate);
      onSaved();
      onOpenChange(false);
    } catch (e) { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Carga masiva de vuelos</DialogTitle>
          <p className="text-sm text-slate-500">{validCount} fila(s) válida(s) de {ROW_COUNT}. Requiere matrícula y fecha.</p>
        </DialogHeader>
        <div className="flex gap-2 items-end mb-3 no-print">
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Pegar datos desde Excel/Sheets — orden de columnas: Matrícula, Fecha, Piloto, Misión, Lugar, Batería, H. despegue, H. aterrizaje</p>
            <textarea className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-green-600" placeholder="Pegar aquí los datos copiados..." value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
          </div>
          <Button onClick={parsePaste} disabled={!pasteText.trim()} className="bg-green-800 hover:bg-green-900">Cargar datos</Button>
        </div>
        <div className="overflow-auto flex-1 border border-slate-200 rounded-lg">
          <table className="w-full text-sm" key={version}>
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="text-left text-slate-500 text-xs uppercase border-b-2 border-slate-200">
                <th className="py-2 px-2 font-medium w-8">#</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">Matrícula</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">Fecha</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">Piloto</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">Misión</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">Lugar despegue y aterrizaje</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">Batería</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">H. despegue</th>
                <th className="py-2 px-2 font-medium whitespace-nowrap">H. aterrizaje</th>
              </tr>
            </thead>
            <BulkTableBody rows={rowsRef.current} handleBlur={handleBlur} />
          </table>
          <datalist id="dl-matricula">{aeronaves.map((a) => <option key={a.id} value={a.matricula} />)}</datalist>
          <datalist id="dl-piloto">{pilotos.map((p) => <option key={p.id} value={`${p.nombre} ${p.apellidos || ""}`.trim()} />)}</datalist>
          <datalist id="dl-mision">{misiones.map((m) => <option key={m.id} value={m.nombre} />)}</datalist>
          <datalist id="dl-bateria">{baterias.filter((b) => b.estado !== "Desechada").sort((a, b) => { const aN = parseInt(a.numero_asignado, 10); const bN = parseInt(b.numero_asignado, 10); if (!isNaN(aN) && !isNaN(bN)) return aN - bN; return (a.numero_asignado || "").localeCompare(b.numero_asignado || ""); }).map((b) => <option key={b.id} value={b.numero_asignado} />)}</datalist>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || validCount === 0} className="bg-green-800 hover:bg-green-900">
            {saving ? "Guardando..." : `Registrar ${validCount} vuelo(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}