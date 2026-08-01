import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BatteryCharging, AlertTriangle, Plus, Wrench, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { totalHorasBateria, formatDuration } from "@/lib/vuelo";
import BateriaMantenimientoForm from "@/components/bateria/BateriaMantenimientoForm";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

export default function BateriaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bateria, setBateria] = useState(null);
  const [vuelos, setVuelos] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMant, setOpenMant] = useState(false);
  const [editingMant, setEditingMant] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [b, v, m] = await Promise.all([
        db.entities.Bateria.get(id),
        db.entities.Vuelo.list(),
        db.entities.BateriaMantenimiento.list("-fecha", 200),
      ]);
      setBateria(b);
      setVuelos(v);
      setMantenimientos(m.filter((x) => x.bateria_numero === b.numero_asignado));
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const horas = bateria ? totalHorasBateria(vuelos, bateria.numero_asignado) : 0;
  const usos = bateria ? vuelos.filter((v) => v.bateria === bateria.numero_asignado).length : 0;
  const ultimo = mantenimientos[0];

  const celdas = ultimo ? [ultimo.voltaje_celda_1, ultimo.voltaje_celda_2, ultimo.voltaje_celda_3, ultimo.voltaje_celda_4].filter((v) => v != null && !isNaN(v)) : [];
  const celdaDiff = celdas.length >= 2 ? Math.max(...celdas) - Math.min(...celdas) : 0;
  const celdaAlerta = celdas.length >= 2 && celdaDiff > 0.2;

  const delMant = async (mid) => { await db.entities.BateriaMantenimiento.delete(mid); load(); };
  const editMant = (m) => { setEditingMant(m); setOpenMant(true); };

  if (loading) return <div className="text-center py-20 text-slate-400">Cargando...</div>;
  if (!bateria) return <div className="text-center py-20 text-slate-400">Batería no encontrada.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-10" id="print-area">
                <PrintHeader title={`Batería ${bateria.numero_asignado || ""} — ${bateria.marca} ${bateria.modelo}`} />
                <div className="flex items-center gap-4 mb-6 no-print">
          <Button variant="ghost" size="icon" onClick={() => navigate("/baterias/gestion")}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center"><BatteryCharging className="w-6 h-6 text-green-700" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{bateria.numero_asignado} — {bateria.marca} {bateria.modelo}</h1>
              <p className="text-slate-500">Nº serie: {bateria.numero_serie || "—"} · Estado: {bateria.estado}</p>
            </div>
            <div className="ml-auto"><PrintButton /></div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-400 mb-1">Horas de vuelo</p>
            <p className="text-2xl font-bold text-slate-900">{formatDuration(horas)}</p>
            <p className="text-sm text-slate-500 mt-1">{usos} vuelo(s)</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-400 mb-1">Ciclos de carga</p>
            <p className="text-2xl font-bold text-slate-900">{bateria.ciclos_carga ?? 0}</p>
          </div>
          <div className={`bg-white rounded-xl border p-5 ${celdaAlerta ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
            <p className="text-xs text-slate-400 mb-1">Voltaje de celdas {ultimo ? `(últ. mant. ${ultimo.fecha})` : ""}</p>
            {celdas.length > 0 ? (
              <div>
                <div className="flex items-baseline gap-3">
                  <p className="text-2xl font-bold text-slate-900">{celdas.map((v) => v.toFixed(2)).join(" / ")}</p>
                  <span className="text-sm text-slate-400">V</span>
                </div>
                {celdaAlerta && (
                  <div className="flex items-center gap-1.5 text-red-600 text-sm mt-2">
                    <AlertTriangle className="w-4 h-4" /> Dif. {celdaDiff.toFixed(2)}V &gt; 0,2V — revisar celdas
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm mt-2">Sin mediciones</p>
            )}
          </div>
        </div>

        {(() => {
          if (mantenimientos.length === 0 || !ultimo?.proxima_fecha) return null;
          const today = new Date().toISOString().slice(0, 10);
          const daysUntil = Math.ceil((new Date(ultimo.proxima_fecha) - new Date(today)) / (1000 * 60 * 60 * 24));
          const overdue = daysUntil < 0;
          const upcoming = daysUntil >= 0 && daysUntil <= 30;
          if (!overdue && !upcoming) return null;
          return (
            <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${overdue ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-amber-200"}`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{overdue ? "Mantenimiento vencido" : "Mantenimiento próximo"} · {ultimo.proxima_fecha}{overdue ? ` (hace ${Math.abs(daysUntil)}d)` : ` (en ${daysUntil}d)`}</span>
            </div>
          );
        })()}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Mantenimientos de esta batería</h2>
          <Button size="sm" className="bg-green-800 hover:bg-green-900" onClick={() => { setEditingMant(null); setOpenMant(true); }}><Plus className="w-4 h-4 mr-1" /> Añadir</Button>
        </div>

        {mantenimientos.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <Wrench className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p>Sin mantenimientos registrados para esta batería.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mantenimientos.map((m) => {
              const vs = [m.voltaje_celda_1, m.voltaje_celda_2, m.voltaje_celda_3, m.voltaje_celda_4].filter((v) => v != null);
              const diff = vs.length >= 2 ? Math.max(...vs) - Math.min(...vs) : 0;
              const alerta = diff > 0.2;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-xl border p-4 ${alerta ? "border-red-300" : "border-slate-200"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-900">{m.tipo}</p>
                      <p className="text-sm text-slate-500">{m.fecha} · TIP: {m.tip}{m.proxima_fecha ? ` · Próxima: ${m.proxima_fecha}` : ""}</p>
                      {m.observaciones && <p className="text-sm text-slate-600 mt-1">{m.observaciones}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {vs.length > 0 && (
                        <div className="text-right">
                          <div className="flex gap-2 text-sm">
                            {vs.map((v, i) => <span key={i} className="font-mono">{v.toFixed(2)}</span>)}
                          </div>
                          {alerta && <span className="text-red-600 text-xs flex items-center gap-1 justify-end mt-1"><AlertTriangle className="w-3 h-3" /> Dif. {diff.toFixed(2)}V</span>}
                        </div>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => editMant(m)}><Pencil className="w-4 h-4 text-slate-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => delMant(m.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BateriaMantenimientoForm open={openMant} onOpenChange={(v) => { setOpenMant(v); if (!v) setEditingMant(null); }} onSaved={load} editing={editingMant} batteryNumber={bateria.numero_asignado} />
    </div>
  );
}