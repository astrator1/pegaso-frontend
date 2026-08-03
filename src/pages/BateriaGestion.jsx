import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, BatteryCharging, Pencil, Search, Ban, ArrowRight, History, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { totalHorasBateria, formatDuration } from "@/lib/vuelo";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

const empty = { marca: "", modelo: "", numero_serie: "", fecha_alta: "", ciclos_carga: 0, numero_asignado: "", estado: "Nueva" };

export default function BateriaGestion() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [vuelos, setVuelos] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [query, setQuery] = useState("");
  const [descartando, setDescartando] = useState(null);
  const [fechaBaja, setFechaBaja] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [data, v, m] = await Promise.all([
        db.entities.Bateria.list("created_date", 200),
        db.entities.Vuelo.list(),
        db.entities.BateriaMantenimiento.list(),
      ]);
      setItems(data);
      setVuelos(v);
      setMantenimientos(m);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      marca: item.marca || "", modelo: item.modelo || "", numero_serie: item.numero_serie || "",
      fecha_alta: item.fecha_alta || "", ciclos_carga: item.ciclos_carga || 0,
      numero_asignado: item.numero_asignado || "", estado: item.estado || "Nueva",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.marca.trim() || !form.modelo.trim() || !form.numero_asignado.trim()) return;
    if (editing) await db.entities.Bateria.update(editing.id, form);
    else await db.entities.Bateria.create(form);
    setOpen(false);
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openDescartar = (item) => {
    setDescartando(item);
    setFechaBaja(new Date().toISOString().slice(0, 10));
  };

  const confirmDescarte = async () => {
    if (!descartando || !fechaBaja) return;
    const yy = fechaBaja.slice(2, 4);
    const mm = fechaBaja.slice(5, 7);
    const dd = fechaBaja.slice(8, 10);
    const numHist = `${descartando.numero_asignado}R${yy}${mm}${dd}`;
    // Reasignar vuelos al número histórico para no perder trazabilidad
    const vsDesc = await db.entities.Vuelo.filter({ bateria: descartando.numero_asignado });
    if (vsDesc.length > 0) await db.entities.Vuelo.bulkUpdate(vsDesc.map((v) => ({ id: v.id, bateria: numHist })));
    // Reasignar mantenimientos al número histórico
    const msDesc = await db.entities.BateriaMantenimiento.filter({ bateria_numero: descartando.numero_asignado });
    if (msDesc.length > 0) await db.entities.BateriaMantenimiento.bulkUpdate(msDesc.map((m) => ({ id: m.id, bateria_numero: numHist })));
    // Liberar el número asignado y marcar como desechada
    await db.entities.Bateria.update(descartando.id, {
      estado: "Desechada",
      fecha_baja: fechaBaja,
      numero_historico: numHist,
      numero_asignado: "",
    });
    setDescartando(null);
    setFechaBaja("");
    load();
  };

  const recuperar = async (b) => {
    const numHist = b.numero_historico;
    if (!numHist) return;
    const numOriginal = numHist.includes("BAT") ? numHist.slice(numHist.indexOf("BAT") + 3) : numHist.split("R")[0];
    // Verificar que el número no esté ya en uso por una batería activa
    const enUso = items.some((x) => x.id !== b.id && x.estado !== "Desechada" && x.numero_asignado === numOriginal);
    if (enUso) {
      alert(`El número ${numOriginal} ya está asignado a una batería activa. No se puede recuperar.`);
      return;
    }
    // Devolver vuelos del histórico al número original
    const vsRec = await db.entities.Vuelo.filter({ bateria: numHist });
    if (vsRec.length > 0) await db.entities.Vuelo.bulkUpdate(vsRec.map((v) => ({ id: v.id, bateria: numOriginal })));
    // Devolver mantenimientos del histórico al número original
    const msRec = await db.entities.BateriaMantenimiento.filter({ bateria_numero: numHist });
    if (msRec.length > 0) await db.entities.BateriaMantenimiento.bulkUpdate(msRec.map((m) => ({ id: m.id, bateria_numero: numOriginal })));
    // Restaurar la batería a estado activo
    await db.entities.Bateria.update(b.id, {
      estado: "En uso",
      fecha_baja: "",
      numero_historico: "",
      numero_asignado: numOriginal,
    });
    load();
  };

  const estadoColor = (e) => ({
    "Nueva": "bg-blue-50 text-blue-700",
    "En uso": "bg-green-50 text-green-700",
    "Descargada": "bg-green-50 text-green-700",
    "Defectuosa": "bg-red-50 text-red-700",
    "Desechada": "bg-slate-200 text-slate-600",
  }[e] || "bg-slate-100 text-slate-500");

  const getMantStatus = (bateriaNum) => {
    const mants = mantenimientos
      .filter((m) => m.bateria_numero === bateriaNum)
      .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    if (mants.length === 0 || !mants[0].proxima_fecha) return null;
    const proxima = mants[0].proxima_fecha;
    const today = new Date().toISOString().slice(0, 10);
    const daysUntil = Math.ceil((new Date(proxima) - new Date(today)) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return { type: "overdue", proxima, days: daysUntil };
    if (daysUntil <= 30) return { type: "upcoming", proxima, days: daysUntil };
    return null;
  };

  const activas = items.filter((b) => b.estado !== "Desechada");
  const historico = items.filter((b) => b.estado === "Desechada");
  const filtered = activas.filter((b) => {
    const q = query.toLowerCase();
    return [b.marca, b.modelo, b.numero_asignado].some((v) => (v || "").toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10" id="print-area">
                <PrintHeader title="Gestión de Baterías" />
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/baterias")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gestión de baterías</h1>
              <p className="text-slate-500">{filtered.length} batería(s) activa(s)</p>
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
            <BatteryCharging className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No hay baterías activas.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((it, i) => {
              const horas = totalHorasBateria(vuelos, it.numero_asignado);
              return (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.03 * i }}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center"><BatteryCharging className="w-5 h-5 text-green-700" /></div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">{it.numero_asignado} <span className="text-slate-400 font-normal">·</span> {it.marca} {it.modelo}</h3>
                        <p className="text-sm text-slate-500">Nº serie: {it.numero_serie || "—"} · {it.estado}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoColor(it.estado)}`}>{it.estado}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-400 block text-xs">Fecha alta</span>{it.fecha_alta || "—"}</div>
                    <div><span className="text-slate-400 block text-xs">Ciclos</span>{it.ciclos_carga ?? 0}</div>
                  </div>
                  {(() => {
                    const LIFE_HOURS = 200;
                    const usedPct = Math.min((horas / 60) / LIFE_HOURS * 100, 100);
                    const remainingPct = Math.max(0, 100 - usedPct);
                    const barColor = remainingPct > 50 ? "bg-green-500" : remainingPct > 20 ? "bg-yellow-500" : "bg-red-500";
                    return (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Horas vuelo: {formatDuration(horas)} / {LIFE_HOURS}h</span>
                          <span>{Math.round(remainingPct)}% vida restante</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${remainingPct}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const ms = getMantStatus(it.numero_asignado);
                    if (!ms) return null;
                    return (
                      <div className={`mt-4 flex items-center gap-2 rounded-lg p-2.5 text-sm ${ms.type === "overdue" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{ms.type === "overdue" ? "Mantenimiento vencido" : "Mantenimiento próximo"} · {ms.proxima} ({ms.type === "overdue" ? `hace ${Math.abs(ms.days)}d` : `en ${ms.days}d`})</span>
                      </div>
                    );
                  })()}
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/baterias/${it.id}`)}>Ver ficha <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(it)}><Pencil className="w-3.5 h-3.5 mr-1" /> Editar</Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => openDescartar(it)}><Ban className="w-3.5 h-3.5 mr-1" /> Retirar</Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {historico.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-slate-500" />
              <h2 className="text-xl font-semibold text-slate-900">Histórico de baterías retiradas</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Nº histórico</th>
                    <th className="text-left px-4 py-3 font-medium">Nº asignado</th>
                    <th className="text-left px-4 py-3 font-medium">Marca / Modelo</th>
                    <th className="text-left px-4 py-3 font-medium">Fecha baja</th>
                    <th className="text-left px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historico.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-900">{b.numero_historico || "—"}</td>
                      <td className="px-4 py-3">{b.numero_asignado || "—"}</td>
                      <td className="px-4 py-3">{b.marca} {b.modelo}</td>
                      <td className="px-4 py-3">{b.fecha_baja || "—"}</td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => recuperar(b)}><RotateCcw className="w-3.5 h-3.5 mr-1" /> Recuperar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar batería" : "Nueva batería"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Marca *</Label><Input value={form.marca} onChange={(e) => set("marca", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Modelo *</Label><Input value={form.modelo} onChange={(e) => set("modelo", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Número de serie</Label><Input value={form.numero_serie} onChange={(e) => set("numero_serie", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Número asignado *</Label><Input value={form.numero_asignado} onChange={(e) => set("numero_asignado", e.target.value)} placeholder="Ej: BAT-01" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Fecha de alta</Label><Input type="date" value={form.fecha_alta} onChange={(e) => set("fecha_alta", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Ciclos de carga</Label><Input type="number" value={form.ciclos_carga} onChange={(e) => set("ciclos_carga", Number(e.target.value))} /></div>
            </div>
            <div className="grid gap-2"><Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => set("estado", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nueva">Nueva</SelectItem>
                  <SelectItem value="En uso">En uso</SelectItem>
                  <SelectItem value="Descargada">Descargada</SelectItem>
                  <SelectItem value="Defectuosa">Defectuosa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-green-800 hover:bg-green-900">{editing ? "Guardar" : "Crear batería"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!descartando} onOpenChange={(v) => !v && setDescartando(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Retirar batería</DialogTitle></DialogHeader>
          <p className="text-slate-600 text-sm">Se va a retirar la batería <strong>{descartando?.numero_asignado}</strong> ({descartando?.marca} {descartando?.modelo}). El número asignado quedará libre para reutilizarlo en una nueva batería. Los vuelos y mantenimientos asociados pasarán al número histórico para conservar la trazabilidad.</p>
          <div className="grid gap-2">
            <Label>Fecha de baja</Label>
            <Input type="date" value={fechaBaja} onChange={(e) => setFechaBaja(e.target.value)} />
          </div>
          {descartando && fechaBaja && (
            <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">Número histórico generado: <span className="font-mono font-semibold text-slate-900">{descartando.numero_asignado}R{fechaBaja.slice(2,4)}{fechaBaja.slice(5,7)}{fechaBaja.slice(8,10)}</span></p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDescartando(null)}>Cancelar</Button>
            <Button onClick={confirmDescarte} className="bg-red-600 hover:bg-red-700">Retirar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}