import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, FileText, Search, Upload, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";

import { flightDuration, formatDuration } from "@/lib/vuelo";
import VueloForm from "@/components/vuelos/VueloForm";
import VueloBulkForm from "@/components/vuelos/VueloBulkForm";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

export default function RegistroGeneral() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminLevel = user?.role === "admin" || user?.role === "superadmin";
  const backTo = "/operaciones";
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.entities.Vuelo.list("-created_date", 5000);
      setVuelos(data);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totals = {};
  vuelos.forEach((v) => {
    totals[v.matricula] = (totals[v.matricula] || 0) + flightDuration(v.hora_despegue, v.hora_aterrizaje);
  });

  const filtered = vuelos.filter((v) => {
    const q = query.toLowerCase();
    return [v.matricula, v.piloto, v.mision, v.bateria].some((x) => (x || "").toLowerCase().includes(q));
  });

  const remove = async (id) => { await db.entities.Vuelo.delete(id); load(); };
  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (v) => { setEditing(v); setOpen(true); };
  const canEditVuelo = (v) => isAdminLevel || !v.estado || v.estado === "pendiente";

  const handleDecidir = async (id, estado) => {
    setBusyId(id);
    try {
      await db.vueloRevision.decidir(id, estado);
      load();
    } catch (e) { /* ignore */ }
    finally { setBusyId(null); }
  };

  const pendientes = vuelos.filter((v) => !v.estado || v.estado === "pendiente").length;

  const toggleSelected = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map((v) => v.id));
  const bulkDelete = async () => {
    for (const id of selected) { try { await db.entities.Vuelo.delete(id); } catch (e) { } }
    setSelected([]); load();
  };
  const bulkValidar = async (ids) => {
    setBusyId("bulk");
    for (const id of ids) { try { await db.vueloRevision.decidir(id, "validado"); } catch (e) { } }
    setBusyId(null);
    setSelected([]); load();
  };
  const validarTodosPendientes = () => {
    const ids = vuelos.filter((v) => !v.estado || v.estado === "pendiente").map((v) => v.id);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Validar los ${ids.length} vuelos pendientes?`)) return;
    bulkValidar(ids);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-10" id="print-area">
                <PrintHeader title="Registro General de Vuelos" />
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(backTo)}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Registro General</h1>
              <p className="text-slate-500">
                {filtered.length} vuelo(s) registrado(s)
                {isAdminLevel && pendientes > 0 ? ` · ${pendientes} pendiente(s) de validar` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button onClick={() => setBulkOpen(true)} variant="outline"><Upload className="w-4 h-4 mr-1" /> Carga masiva</Button>
            {isAdminLevel && pendientes > 0 && (
              <Button onClick={validarTodosPendientes} disabled={busyId === "bulk"} variant="outline" className="text-green-700 border-green-200 hover:bg-green-50">
                <Check className="w-4 h-4 mr-1" /> Validar todos los pendientes ({pendientes})
              </Button>
            )}
            <Button onClick={openNew} className="bg-green-800 hover:bg-green-900"><Plus className="w-4 h-4 mr-1" /> Añadir vuelo</Button>
            <PrintButton />
          </div>
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3 mb-4 no-print">
            <span className="text-sm text-slate-600">{selected.length} seleccionado(s)</span>
            {isAdminLevel && (
              <Button variant="outline" size="sm" disabled={busyId === "bulk"} className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => bulkValidar(selected)}>
                <Check className="w-4 h-4 mr-1" /> Validar seleccionados
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={bulkDelete}><Trash2 className="w-4 h-4 mr-1" /> Borrar seleccionados</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Cancelar</Button>
          </div>
        )}

        {Object.keys(totals).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(totals).map(([mat, min]) => (
              <span key={mat} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm">
                <span className="font-medium text-slate-900">{mat}</span>
                <span className="text-slate-400"> · {formatDuration(min)} totales</span>
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No hay vuelos registrados todavía.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-3 no-print"><Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></th>
                  <th className="px-3 py-3 font-medium">Matrícula</th>
                  <th className="px-3 py-3 font-medium">Fecha</th>
                  <th className="px-3 py-3 font-medium">Piloto</th>
                  <th className="px-3 py-3 font-medium">Misión</th>
                  <th className="px-3 py-3 font-medium">Lugar despegue y aterrizaje</th>
                  <th className="px-3 py-3 font-medium">Batería</th>
                  <th className="px-3 py-3 font-medium">H. despegue</th>
                  <th className="px-3 py-3 font-medium">H. aterrizaje</th>
                  <th className="px-3 py-3 font-medium">Duración / Total</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-3 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => {
                  const dur = flightDuration(v.hora_despegue, v.hora_aterrizaje);
                  return (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.02 * i }}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2.5 no-print"><Checkbox checked={selected.includes(v.id)} onCheckedChange={() => toggleSelected(v.id)} /></td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">{v.matricula || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{v.fecha || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{v.piloto || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{v.mision || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{v.lugar || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{v.bateria || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{v.hora_despegue || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{v.hora_aterrizaje || "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-900">{formatDuration(dur)}</div>
                        <div className="text-xs text-slate-400">Total {v.matricula}: {formatDuration(totals[v.matricula] || 0)}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        {(!v.estado || v.estado === "pendiente") ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>
                        ) : v.estado === "validado" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Validado</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rechazado</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 no-print">
                          {isAdminLevel && (!v.estado || v.estado === "pendiente") && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" disabled={busyId === v.id} onClick={() => handleDecidir(v.id, "validado")} title="Validar">
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" disabled={busyId === v.id} onClick={() => handleDecidir(v.id, "rechazado")} title="Rechazar">
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          {canEditVuelo(v) && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => remove(v.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VueloForm open={open} onOpenChange={setOpen} onSaved={load} editing={editing} />
      <VueloBulkForm open={bulkOpen} onOpenChange={setBulkOpen} onSaved={load} />
    </div>
  );
}