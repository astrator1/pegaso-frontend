import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Drone } from "@/components/DroneIcon";
import { Button } from "@/components/ui/button";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatDuration } from "@/lib/vuelo";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

export default function EstadoFlota() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [data, v] = await Promise.all([
          db.entities.Aeronave.list(),
          db.entities.Vuelo.list(),
        ]);
        setItems(data);
        setVuelos(v);
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const total = items.length;
  const operativas = items.filter((a) => a.operativa !== false).length;
  const noOperativas = total - operativas;
  const horasTotales = items.reduce((s, a) => {
    const h = vuelos.filter((v) => v.matricula === a.matricula)
      .reduce((ss, v) => {
        const [hd, md] = (v.hora_despegue || "").split(":").map(Number);
        const [ha, ma] = (v.hora_aterrizaje || "").split(":").map(Number);
        if (isNaN(hd) || isNaN(ha)) return ss;
        let d = (ha * 60 + ma) - (hd * 60 + md);
        if (d < 0) d += 1440;
        return ss + d;
      }, 0);
    return s + h;
  }, 0);

  const hoy = new Date();
  const en30dias = new Date(); en30dias.setDate(hoy.getDate() + 30);
  const mantenimientoProximo = items.filter((a) => {
    if (!a.proximo_mantenimiento) return false;
    const f = new Date(a.proximo_mantenimiento);
    return f >= hoy && f <= en30dias;
  });
  const mantenimientoVencido = items.filter((a) => {
    if (!a.proximo_mantenimiento) return false;
    return new Date(a.proximo_mantenimiento) < hoy;
  });

  const pieData = [
    { name: "Operativas", value: operativas, color: "#15803d" },
    { name: "No operativas", value: noOperativas, color: "#dc2626" },
  ];

  const stats = [
    { label: "Total flota", value: total, icon: Drone, color: "text-green-700", bg: "bg-green-50", aircraft: items },
    { label: "Operativas", value: operativas, icon: CheckCircle2, color: "text-green-700", bg: "bg-green-50", aircraft: items.filter((a) => a.operativa !== false) },
    { label: "No operativas", value: noOperativas, icon: XCircle, color: "text-red-600", bg: "bg-red-50", aircraft: items.filter((a) => a.operativa === false) },
    { label: "Horas totales", value: formatDuration(horasTotales), icon: Clock, color: "text-green-700", bg: "bg-green-50", aircraft: null },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10" id="print-area">
                <PrintHeader title="Estado de Flota" />
                <div className="flex items-center gap-4 mb-10 no-print">
                  <Button variant="ghost" size="icon" onClick={() => navigate("/aeronaves")}><ArrowLeft className="w-5 h-5" /></Button>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Estado de Flota</h1>
                    <p className="text-slate-500">Resumen general de las aeronaves</p>
                  </div>
                  <div className="ml-auto"><PrintButton /></div>
                </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 * i }} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${s.color}`} /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-sm text-slate-500">{s.label}</p>
                  </div>
                </div>
                {s.aircraft && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {s.aircraft.map((a) => (
                      <button key={a.id} onClick={() => navigate(`/aeronaves/gestion/${a.id}?tab=cuaderno`)} className="block w-full text-left text-sm px-2 py-1.5 rounded hover:bg-slate-50">
                        <span className="font-medium text-slate-900">{a.matricula}</span>
                        <span className="text-slate-500"> · {a.marca} {a.modelo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Operatividad</h2>
            {total === 0 ? <p className="text-slate-400 text-center py-10">Sin datos</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Mantenimientos</h2>
            <div className="space-y-4">
              {mantenimientoVencido.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">Vencidos ({mantenimientoVencido.length})</p>
                  <div className="space-y-1">
                    {mantenimientoVencido.map((a) => (
                      <div key={a.id} className="flex justify-between text-sm bg-red-50 rounded px-3 py-2">
                        <span className="text-slate-800">{a.matricula} · {a.marca} {a.modelo}</span>
                        <span className="text-red-600">{a.proximo_mantenimiento}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {mantenimientoProximo.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-2">Próximos 30 días ({mantenimientoProximo.length})</p>
                  <div className="space-y-1">
                    {mantenimientoProximo.map((a) => (
                      <div key={a.id} className="flex justify-between text-sm bg-amber-50 rounded px-3 py-2">
                        <span className="text-slate-800">{a.matricula} · {a.marca} {a.modelo}</span>
                        <span className="text-amber-600">{a.proximo_mantenimiento}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {mantenimientoVencido.length === 0 && mantenimientoProximo.length === 0 && (
                <p className="text-slate-400 text-center py-8">No hay mantenimientos pendientes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}