import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const empty = { nombre: "", numero_serie: "", estado: "Operativo", fecha: "" };

const estadoColor = (e) => ({
  "Operativo": "bg-green-50 text-green-700",
  "Averiado": "bg-amber-50 text-amber-700",
  "Baja": "bg-red-50 text-red-700",
}[e] || "bg-slate-100 text-slate-500");

export default function MaterialTab({ matricula }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    try {
      const data = await db.entities.Material.list("-created_date", 200);
      setItems(data.filter((m) => m.matricula === matricula));
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, [matricula]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ nombre: m.nombre || "", numero_serie: m.numero_serie || "", estado: m.estado || "Operativo", fecha: m.fecha || "" }); setOpen(true); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.nombre.trim()) return;
    if (editing) await db.entities.Material.update(editing.id, { ...form, matricula });
    else await db.entities.Material.create({ ...form, matricula });
    setOpen(false);
    load();
  };

  const remove = async (id) => { await db.entities.Material.delete(id); load(); };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-900">Registros de material</h3>
        <Button size="sm" onClick={openNew} className="bg-green-800 hover:bg-green-900"><Plus className="w-4 h-4 mr-1" /> Añadir</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-slate-400"><Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />No hay registros de material.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wide">
                <th className="py-2 px-3 font-medium">Nombre</th>
                <th className="py-2 px-3 font-medium">Nº Serie</th>
                <th className="py-2 px-3 font-medium">Estado</th>
                <th className="py-2 px-3 font-medium">Fecha</th>
                <th className="py-2 px-3 font-medium text-right no-print">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-green-50/50">
                  <td className="py-2 px-3 font-medium text-slate-900">{m.nombre}</td>
                  <td className="py-2 px-3">{m.numero_serie || "—"}</td>
                  <td className="py-2 px-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoColor(m.estado)}`}>{m.estado}</span></td>
                  <td className="py-2 px-3 whitespace-nowrap">{m.fecha || "—"}</td>
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
          <DialogHeader><DialogTitle>{editing ? "Editar material" : "Nuevo material"} · {matricula}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Nombre del material *</Label><Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Número de serie</Label><Input value={form.numero_serie} onChange={(e) => set("numero_serie", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => set("estado", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operativo">Operativo</SelectItem>
                    <SelectItem value="Averiado">Averiado</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2"><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} /></div>
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