import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Pencil, Plus, Search, BookOpen, Wrench, Package, Cog } from "lucide-react";
import { Drone } from "@/components/DroneIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { totalHorasMatricula, formatDuration } from "@/lib/vuelo";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

const empty = {
  matricula: "", marca: "", modelo: "", numero_serie: "", callsign: "",
  fecha_adjudicacion: "", horas_vuelo: 0,
  ultimo_mantenimiento: "", proximo_mantenimiento: "",
  operativa: true,
};

export default function Aeronaves() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [query, setQuery] = useState("");
  const [submenuItem, setSubmenuItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [data, v] = await Promise.all([
        db.entities.Aeronave.list("fecha_adjudicacion", 100),
        db.entities.Vuelo.list(),
      ]);
      setItems(data);
      setVuelos(v);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      matricula: item.matricula || "", marca: item.marca || "", modelo: item.modelo || "",
      numero_serie: item.numero_serie || "", callsign: item.callsign || "", fecha_adjudicacion: item.fecha_adjudicacion || "",
      horas_vuelo: item.horas_vuelo || 0,
      ultimo_mantenimiento: item.ultimo_mantenimiento || "",
      proximo_mantenimiento: item.proximo_mantenimiento || "",
      operativa: item.operativa !== false,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.matricula.trim() || !form.marca.trim() || !form.modelo.trim()) return;
    if (editing) await db.entities.Aeronave.update(editing.id, form);
    else await db.entities.Aeronave.create(form);
    setOpen(false);
    load();
  };

  const remove = async (id) => { await db.entities.Aeronave.delete(id); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = items.filter((a) => {
    const q = query.toLowerCase();
    return [a.matricula, a.marca, a.modelo].some((v) => (v || "").toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10" id="print-area">
                <PrintHeader title="Aeronaves" />
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/aeronaves")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Aeronaves</h1>
              <p className="text-slate-500">{filtered.length} aeronave(s) registrada(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button onClick={openNew} className="bg-green-800 hover:bg-green-900"><Plus className="w-4 h-4 mr-1" /> Nueva</Button>
            <PrintButton />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Drone className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No hay aeronaves registradas todavía.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((it, i) => {
              const horas = totalHorasMatricula(vuelos, it.matricula);
              return (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.03 * i }}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSubmenuItem(it)}>
                      <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center"><Drone className="w-5 h-5 text-green-700" /></div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 hover:text-green-700">{it.matricula || "—"}</h3>
                        <p className="text-sm text-slate-500">{it.marca} {it.modelo}{it.numero_serie ? ` · S/N ${it.numero_serie}` : ""}{it.callsign ? ` · CS ${it.callsign}` : ""}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${it.operativa !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {it.operativa !== false ? "Operativa" : "No operativa"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-400 block text-xs">Adjudicación</span>{it.fecha_adjudicacion || "—"}</div>
                    <div><span className="text-slate-400 block text-xs">Horas de vuelo</span>{formatDuration(horas)}</div>
                    <div><span className="text-slate-400 block text-xs">Últ. mantenimiento</span>{it.ultimo_mantenimiento || "—"}</div>
                    <div><span className="text-slate-400 block text-xs">Próx. mantenimiento</span>{it.proximo_mantenimiento || "—"}</div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="default" size="sm" className="bg-green-800 hover:bg-green-900" onClick={() => setSubmenuItem(it)}>Ver fichas</Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(it)}><Pencil className="w-3.5 h-3.5 mr-1" /> Editar</Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => remove(it.id)}><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar aeronave" : "Nueva aeronave"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Matrícula *</Label><Input value={form.matricula} onChange={(e) => set("matricula", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Marca *</Label><Input value={form.marca} onChange={(e) => set("marca", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Modelo *</Label><Input value={form.modelo} onChange={(e) => set("modelo", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Número de serie</Label><Input value={form.numero_serie} onChange={(e) => set("numero_serie", e.target.value)} /></div>
              <div className="grid gap-2"><Label>CALLSIGN</Label><Input value={form.callsign} onChange={(e) => set("callsign", e.target.value)} placeholder="Indicativo" /></div>
            </div>
            <div className="grid gap-2"><Label>Fecha de adjudicación</Label><Input type="date" value={form.fecha_adjudicacion} onChange={(e) => set("fecha_adjudicacion", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Último mantenimiento</Label><Input type="date" value={form.ultimo_mantenimiento} onChange={(e) => set("ultimo_mantenimiento", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Próximo mantenimiento</Label><Input type="date" value={form.proximo_mantenimiento} onChange={(e) => set("proximo_mantenimiento", e.target.value)} /></div>
            </div>
            <div className="text-sm text-slate-400 -mt-1">Las horas de vuelo se calculan automáticamente desde el Registro General.</div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <Checkbox id="op-check" checked={form.operativa} onCheckedChange={(v) => set("operativa", !!v)} />
              <Label htmlFor="op-check" className="text-sm font-medium cursor-pointer">Operativa (Sí)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-green-800 hover:bg-green-900">{editing ? "Guardar" : "Crear aeronave"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!submenuItem} onOpenChange={(o) => !o && setSubmenuItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fichas de aeronave</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-semibold text-slate-700">{submenuItem?.matricula}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{submenuItem?.marca} {submenuItem?.modelo}</span>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:border-green-800 hover:bg-green-50 transition-colors" onClick={() => { const it = submenuItem; setSubmenuItem(null); navigate(`/aeronaves/gestion/${it.id}?tab=cuaderno`); }}>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><BookOpen className="w-6 h-6 text-green-800" /></div>
              <span className="font-medium text-slate-900">Cuaderno de aeronave</span>
              <span className="text-xs text-slate-500">Registro de vuelos</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:border-green-600 hover:bg-green-50 transition-colors" onClick={() => { const it = submenuItem; setSubmenuItem(null); navigate(`/aeronaves/gestion/${it.id}?tab=mantenimiento`); }}>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><Wrench className="w-6 h-6 text-green-600" /></div>
              <span className="font-medium text-slate-900">Mantenimiento</span>
              <span className="text-xs text-slate-500">Inspecciones y revisiones</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:border-green-500 hover:bg-green-50 transition-colors" onClick={() => { const it = submenuItem; setSubmenuItem(null); navigate(`/aeronaves/gestion/${it.id}?tab=material`); }}>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><Package className="w-6 h-6 text-green-500" /></div>
              <span className="font-medium text-slate-900">Material</span>
              <span className="text-xs text-slate-500">Equipamiento asociado</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:border-emerald-600 hover:bg-green-50 transition-colors" onClick={() => { const it = submenuItem; setSubmenuItem(null); navigate(`/aeronaves/gestion/${it.id}?tab=modificaciones`); }}>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><Cog className="w-6 h-6 text-emerald-600" /></div>
              <span className="font-medium text-slate-900">Modificaciones</span>
              <span className="text-xs text-slate-500">Cambios y reparaciones</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}