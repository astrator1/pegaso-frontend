import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const empty = {
  matricula: "", fecha: "", piloto: "", mision: "",
  lugar: "", bateria: "",
  hora_despegue: "", hora_aterrizaje: "",
  pre_vuelo: false, pos_vuelo: false,
  observaciones: "", tip_piloto: "", firma: "",
};

export default function VueloForm({ open, onOpenChange, onSaved, editing }) {
  const [form, setForm] = useState(empty);
  const [aeronaves, setAeronaves] = useState([]);
  const [pilotos, setPilotos] = useState([]);
  const [baterias, setBaterias] = useState([]);
  const [misiones, setMisiones] = useState([]);

  useEffect(() => {
    if (open) setForm(editing ? { ...empty, ...editing } : empty);
  }, [editing, open]);

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

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.matricula || !form.fecha) return;
    if (editing) await db.entities.Vuelo.update(editing.id, form);
    else await db.entities.Vuelo.create(form);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Editar vuelo" : "Nuevo vuelo"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Matrícula *</Label>
              <Select value={form.matricula} onValueChange={(v) => set("matricula", v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona aeronave" /></SelectTrigger>
                <SelectContent>
                  {aeronaves.map((a) => <SelectItem key={a.id} value={a.matricula}>{a.matricula}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Fecha de vuelo *</Label><Input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Piloto</Label>
              <Select value={form.piloto} onValueChange={(v) => {
                set("piloto", v);
                if (v) {
                  const piloto = pilotos.find((p) => `${p.nombre} ${p.apellidos || ""}`.trim() === v);
                  if (piloto?.tip) set("tip_piloto", piloto.tip);
                } else {
                  set("tip_piloto", "");
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Selecciona piloto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sin asignar</SelectItem>
                  {pilotos.map((p) => <SelectItem key={p.id} value={`${p.nombre} ${p.apellidos || ""}`.trim()}>{p.nombre} {p.apellidos}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Misión</Label>
              <Select value={form.mision} onValueChange={(v) => set("mision", v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona misión" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sin asignar</SelectItem>
                  {misiones.map((m) => <SelectItem key={m.id} value={m.nombre}>{m.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Lugar de despegue y aterrizaje</Label><Input value={form.lugar} onChange={(e) => set("lugar", e.target.value)} /></div>
          </div>
          <div className="grid gap-2">
            <Label>Batería utilizada</Label>
            <Select value={form.bateria} onValueChange={(v) => set("bateria", v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona batería" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Sin asignar</SelectItem>
                {baterias.filter((b) => b.estado !== "Desechada").sort((a, b) => { const aN = parseInt(a.numero_asignado, 10); const bN = parseInt(b.numero_asignado, 10); if (!isNaN(aN) && !isNaN(bN)) return aN - bN; return (a.numero_asignado || "").localeCompare(b.numero_asignado || ""); }).map((b) => <SelectItem key={b.id} value={b.numero_asignado}>{b.numero_asignado} — {b.marca} {b.modelo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Hora de despegue</Label><Input type="time" value={form.hora_despegue} onChange={(e) => set("hora_despegue", e.target.value)} /></div>
            <div className="grid gap-2"><Label>Hora de aterrizaje</Label><Input type="time" value={form.hora_aterrizaje} onChange={(e) => set("hora_aterrizaje", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
              <Checkbox checked={!!form.pre_vuelo} onCheckedChange={(v) => set("pre_vuelo", !!v)} id="pre-vuelo-check" />
              <Label htmlFor="pre-vuelo-check" className="text-sm cursor-pointer">Pre-vuelo realizado</Label>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
              <Checkbox checked={!!form.pos_vuelo} onCheckedChange={(v) => set("pos_vuelo", !!v)} id="pos-vuelo-check" />
              <Label htmlFor="pos-vuelo-check" className="text-sm cursor-pointer">Pos-vuelo realizado</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>TIP del piloto</Label><Input value={form.tip_piloto} onChange={(e) => set("tip_piloto", e.target.value)} placeholder="TIP / identificación del piloto" /></div>
            <div className="grid gap-2"><Label>Firma</Label><Input value={form.firma} onChange={(e) => set("firma", e.target.value)} placeholder="Nombre / firma responsable" /></div>
          </div>
          <div className="grid gap-2"><Label>Observaciones / anomalías</Label><Textarea rows={2} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} className="bg-green-800 hover:bg-green-900">{editing ? "Guardar" : "Registrar vuelo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}