import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Users, Trash2, Pencil, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

const empty = {
  unidad: "", nombre: "", apellidos: "", dni: "", tip: "",
  teorico_apto: false, teorico_fecha: "",
  practico_apto: false, practico_fecha: "",
  radiofonista_apto: false, radiofonista_fecha: "",
  observaciones: "", ok: false,
};

function AptoField({ label, apto, fecha, onApto, onFecha }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <Checkbox checked={apto} onCheckedChange={(v) => onApto(!!v)} />
          <span className="text-sm text-slate-600">{apto ? "Sí" : "No"}</span>
        </div>
      </div>
      <Input type="date" value={fecha || ""} onChange={(e) => onFecha(e.target.value)} />
    </div>
  );
}

export default function Pilotos() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.entities.Piloto.list("-created_date", 100);
      setItems(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      unidad: item.unidad || "", nombre: item.nombre || "", apellidos: item.apellidos || "", dni: item.dni || "", tip: item.tip || "",
      teorico_apto: !!item.teorico_apto, teorico_fecha: item.teorico_fecha || "",
      practico_apto: !!item.practico_apto, practico_fecha: item.practico_fecha || "",
      radiofonista_apto: !!item.radiofonista_apto, radiofonista_fecha: item.radiofonista_fecha || "",
      observaciones: item.observaciones || "", ok: !!item.ok,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nombre.trim() || !form.apellidos.trim()) return;
    if (editing) await db.entities.Piloto.update(editing.id, form);
    else await db.entities.Piloto.create(form);
    setOpen(false);
    load();
  };

  const remove = async (id) => { await db.entities.Piloto.delete(id); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10" id="print-area">
                <PrintHeader title="Pilotos" />
                <div className="flex items-center justify-between mb-8 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Pilotos</h1>
              <p className="text-slate-500">{items.length} piloto(s) registrado(s)</p>
            </div>
          </div>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1" /> Nuevo piloto</Button>
          <PrintButton />
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No hay pilotos registrados todavía.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((it, i) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.03 * i }}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">{it.nombre} {it.apellidos}</h3>
                      <p className="text-sm text-slate-500">DNI: {it.dni || "—"} {it.tip ? `· TIP: ${it.tip}` : ""} {it.unidad ? `· Unidad: ${it.unidad}` : ""}</p>
                    </div>
                  </div>
                  {it.ok && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OK
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <span className="text-slate-400 block text-xs mb-1">Teórico</span>
                    <div className="flex items-center gap-2">
                      {it.teorico_apto ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>{it.teorico_apto ? "Sí" : "No"}</span>
                      {it.teorico_fecha && <span className="text-xs text-slate-400">{it.teorico_fecha}</span>}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <span className="text-slate-400 block text-xs mb-1">Práctico</span>
                    <div className="flex items-center gap-2">
                      {it.practico_apto ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>{it.practico_apto ? "Sí" : "No"}</span>
                      {it.practico_fecha && <span className="text-xs text-slate-400">{it.practico_fecha}</span>}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <span className="text-slate-400 block text-xs mb-1">Radiofonista</span>
                    <div className="flex items-center gap-2">
                      {it.radiofonista_apto ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>{it.radiofonista_apto ? "Sí" : "No"}</span>
                      {it.radiofonista_fecha && <span className="text-xs text-slate-400">{it.radiofonista_fecha}</span>}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <span className="text-slate-400 block text-xs mb-1">Observaciones</span>
                    <span className="text-slate-700 line-clamp-2">{it.observaciones || "—"}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(it)}><Pencil className="w-3.5 h-3.5 mr-1" /> Editar</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => remove(it.id)}><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar piloto" : "Nuevo piloto"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2"><Label>Unidad</Label><Input value={form.unidad} onChange={(e) => set("unidad", e.target.value)} /></div>
              <div className="grid gap-2"><Label>DNI</Label><Input value={form.dni} onChange={(e) => set("dni", e.target.value)} /></div>
              <div className="grid gap-2"><Label>TIP</Label><Input value={form.tip} onChange={(e) => set("tip", e.target.value)} placeholder="TIP del piloto" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Apellidos *</Label><Input value={form.apellidos} onChange={(e) => set("apellidos", e.target.value)} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <AptoField label="Teórico" apto={form.teorico_apto} fecha={form.teorico_fecha} onApto={(v) => set("teorico_apto", v)} onFecha={(v) => set("teorico_fecha", v)} />
              <AptoField label="Práctico" apto={form.practico_apto} fecha={form.practico_fecha} onApto={(v) => set("practico_apto", v)} onFecha={(v) => set("practico_fecha", v)} />
              <AptoField label="Radiofonista" apto={form.radiofonista_apto} fecha={form.radiofonista_fecha} onApto={(v) => set("radiofonista_apto", v)} onFecha={(v) => set("radiofonista_fecha", v)} />
            </div>

            <div className="grid gap-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <Checkbox checked={form.ok} onCheckedChange={(v) => set("ok", !!v)} id="ok-check" />
              <Label htmlFor="ok-check" className="text-sm font-medium cursor-pointer">Marcar como OK (piloto validado)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-blue-600 hover:bg-blue-700">{editing ? "Guardar" : "Crear piloto"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}