import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { totalHorasMatriculaHastaFecha } from "@/lib/vuelo";

const empty = { fecha: "", lugar: "", detalle_modificaciones: "", observaciones: "", tip_responsable: "", horas_aeronave: 0, minutos_aeronave: 0 };

export default function ModificacionesTab({ matricula }) {
  const [items, setItems] = useState([]);
  const [vuelos, setVuelos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    try {
      const [data, v] = await Promise.all([
        db.entities.Modificaciones.list("-fecha", 200),
        db.entities.Vuelo.list(),
      ]);
      setItems(data.filter((m) => m.matricula === matricula));
      setVuelos(v);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, [matricula]);

  useEffect(() => {
    if (form.fecha) {
      const totalMin = totalHorasMatriculaHastaFecha(vuelos, matricula, form.fecha);
      setForm((f) => ({ ...f, horas_aeronave: Math.floor(totalMin / 60), minutos_aeronave: totalMin % 60 }));
    }
  }, [form.fecha, vuelos, matricula]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({ fecha: m.fecha || "", lugar: m.lugar || "", detalle_modificaciones: m.detalle_modificaciones || "", observaciones: m.observaciones || "", tip_responsable: m.tip_responsable || "", horas_aeronave: m.horas_aeronave || 0, minutos_aeronave: m.minutos_aeronave || 0 });
    setOpen(true);
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (editing) await db.entities.Modificaciones.update(editing.id, { ...form, matricula });
    else await db.entities.Modificaciones.create({ ...form, matricula });
    setOpen(false); load();
  };

  const remove = async (id) => { await db.entities.Modificaciones.delete(id); load(); };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-900">Registros de modificaciones</h3>
        <Button size="sm" onClick={openNew} className="bg-green-800 hover:bg-green-900"><Plus className="w-4 h-4 mr-1" /> Añadir</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-slate-400"><Wrench className="w-10 h-10 mx-auto mb-3 text-slate-300" />No hay registros de modificaciones.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wide">
                <th className="py-2 px-3 font-medium">Fecha</th>
                <th className="py-2 px-3 font-medium">Lugar</th>
                <th className="py-2 px-3 font-medium">Detalle</th>
                <th className="py-2 px-3 font-medium">Horas aer.</th>
                <th className="py-2 px-3 font-medium">TIP</th>
                <th className="py-2 px-3 font-medium text-right no-print">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-green-50/50">
                  <td className="py-2 px-3 whitespace-nowrap">{m.fecha || "—"}</td>
                  <td className="py-2 px-3">{m.lugar || "—"}</td>
                  <td className="py-2 px-3 max-w-[250px] truncate" title={m.detalle_modificaciones || ""}>{m.detalle_modificaciones || "—"}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{m.horas_aeronave || 0}h {m.minutos_aeronave || 0}m</td>
                  <td className="py-2 px-3 whitespace-nowrap">{m.tip_responsable || "—"}</td>
                  <td className="py-2 px-3 no-print">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => remove(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar modificación" : "Nueva modificación"} · {matricula}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Fecha de realización</Label><Input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Lugar</Label><Input value={form.lugar} onChange={(e) => set("lugar", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Horas de aeronave (auto)</Label><Input type="number" value={form.horas_aeronave} readOnly className="bg-slate-50" /></div>
              <div className="grid gap-2"><Label>Minutos de aeronave (auto)</Label><Input type="number" value={form.minutos_aeronave} readOnly className="bg-slate-50" /></div>
            </div>
            <div className="text-xs text-slate-400 -mt-2">Calculado automáticamente desde los registros de vuelo hasta la fecha de realización.</div>
            <div className="grid gap-2"><Label>Detalle de modificaciones y referencia del fabricante</Label><Textarea rows={3} value={form.detalle_modificaciones} onChange={(e) => set("detalle_modificaciones", e.target.value)} /></div>
            <div className="grid gap-2"><Label>Observaciones</Label><Textarea rows={2} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} /></div>
            <div className="grid gap-2"><Label>TIP responsable</Label><Input value={form.tip_responsable} onChange={(e) => set("tip_responsable", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-green-800 hover:bg-green-900">{editing ? "Guardar" : "Añadir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}