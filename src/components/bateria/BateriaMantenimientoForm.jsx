import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { AlertTriangle } from "lucide-react";

const empty = { bateria_numero: "", tip: "", tipo: "", fecha: "", proxima_fecha: "", observaciones: "", voltaje_celda_1: 0, voltaje_celda_2: 0, voltaje_celda_3: 0, voltaje_celda_4: 0 };

export default function BateriaMantenimientoForm({ open, onOpenChange, onSaved, editing, batteryNumber }) {
  const [form, setForm] = useState(empty);
  const [baterias, setBaterias] = useState([]);

  useEffect(() => {
    if (open) setForm(editing ? { ...empty, ...editing } : { ...empty, bateria_numero: batteryNumber || "" });
  }, [editing, open, batteryNumber]);

  useEffect(() => {
    (async () => {
      try {
        const data = await db.entities.Bateria.list();
        setBaterias(data.filter((b) => b.estado !== "Desechada"));
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const voltajes = [form.voltaje_celda_1, form.voltaje_celda_2, form.voltaje_celda_3, form.voltaje_celda_4].map(Number);
  const maxV = Math.max(...voltajes);
  const minV = Math.min(...voltajes);
  const diff = maxV - minV;
  const diffAlert = diff > 0.2;

  const save = async () => {
    if (!form.bateria_numero || !form.tip || !form.tipo || !form.fecha) return;
    if (editing) await db.entities.BateriaMantenimiento.update(editing.id, form);
    else await db.entities.BateriaMantenimiento.create(form);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Editar mantenimiento" : "Nuevo mantenimiento de batería"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Batería *</Label>
              {editing ? (
                <Input value={form.bateria_numero} onChange={(e) => set("bateria_numero", e.target.value)} />
              ) : (
                <Select value={form.bateria_numero} onValueChange={(v) => set("bateria_numero", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona batería" /></SelectTrigger>
                  <SelectContent>
                    {baterias.map((b) => <SelectItem key={b.id} value={b.numero_asignado}>{b.numero_asignado} — {b.marca} {b.modelo}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2"><Label>Fecha *</Label><Input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>TIP (responsable) *</Label><Input value={form.tip} onChange={(e) => set("tip", e.target.value)} /></div>
            <div className="grid gap-2"><Label>Tipo de mantenimiento *</Label><Input value={form.tipo} onChange={(e) => set("tipo", e.target.value)} placeholder="Ej: Revisión, Cambio de celdas..." /></div>
          </div>
          <div className="grid gap-2"><Label>Próxima revisión</Label><Input type="date" value={form.proxima_fecha} onChange={(e) => set("proxima_fecha", e.target.value)} /></div>
          <div className="grid gap-2">
            <Label>Voltaje de celdas (V)</Label>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="grid gap-1">
                  <span className="text-xs text-slate-400">Celda {n}</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={form[`voltaje_celda_${n}`]}
                    onChange={(e) => set(`voltaje_celda_${n}`, Number(e.target.value))}
                    className={diffAlert ? "border-red-500" : ""}
                  />
                </div>
              ))}
            </div>
          </div>
          {diffAlert && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Precaución: la diferencia entre celdas es de {diff.toFixed(2)}V, superior al límite permitido de 0,2V. Revise las celdas.</span>
            </div>
          )}
          <div className="grid gap-2"><Label>Observaciones</Label><Textarea rows={3} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} className="bg-green-800 hover:bg-green-900">{editing ? "Guardar" : "Registrar mantenimiento"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}