import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, BatteryCharging, FileText, Clock, Plane, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Drone } from "@/components/DroneIcon";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { flightDuration, formatDuration, totalHorasBateria } from "@/lib/vuelo";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

const GREEN = "#15803d";
const GREEN_LIGHT = "#4ade80";
const RED = "#dc2626";
const AMBER = "#eab308";
const BLUE = "#3b82f6";
const SLATE = "#94a3b8";

export default function PanelEstadistico() {
  const navigate = useNavigate();
  const [data, setData] = useState({ aeronaves: [], pilotos: [], baterias: [], vuelos: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, p, b, v] = await Promise.all([
          db.entities.Aeronave.list(),
          db.entities.Piloto.list(),
          db.entities.Bateria.list(),
          db.entities.Vuelo.list(),
        ]);
        setData({ aeronaves: a, pilotos: p, baterias: b, vuelos: v });
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;

  const { aeronaves, pilotos, baterias, vuelos } = data;

  // --- KPIs ---
  const operativas = aeronaves.filter((a) => a.operativa !== false).length;
  const pilotosOk = pilotos.filter((p) => p.ok).length;
  const bateriasActivas = baterias.filter((b) => b.estado !== "Desechada").length;
  const totalMinutosVuelo = vuelos.reduce((s, v) => s + flightDuration(v.hora_despegue, v.hora_aterrizaje), 0);

  // --- Vuelos por mes (últimos 6 meses) ---
  const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const ahora = new Date();
  const vuelosPorMes = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = vuelos.filter((v) => v.fecha && v.fecha.startsWith(key)).length;
    vuelosPorMes.push({ mes: mesesLabels[d.getMonth()], vuelos: count });
  }

  // --- Horas por aeronave ---
  const horasPorAeronave = aeronaves
    .map((a) => {
      const mins = vuelos
        .filter((v) => v.matricula === a.matricula)
        .reduce((s, v) => s + flightDuration(v.hora_despegue, v.hora_aterrizaje), 0);
      return { matricula: a.matricula || "—", horas: Math.round(mins / 60 * 10) / 10 };
    })
    .sort((a, b) => b.horas - a.horas)
    .slice(0, 10);

  // --- Estado de baterías ---
  const estadoBaterias = {};
  baterias.filter((b) => b.estado !== "Desechada").forEach((b) => {
    estadoBaterias[b.estado] = (estadoBaterias[b.estado] || 0) + 1;
  });
  const estadoColors = { "Nueva": BLUE, "En uso": GREEN, "Descargada": GREEN_LIGHT, "Defectuosa": RED };
  const pieBaterias = Object.entries(estadoBaterias).map(([name, value]) => ({ name, value, color: estadoColors[name] || SLATE }));

  // --- Certificaciones de pilotos ---
  const certData = [
    { name: "Teórico", aptos: pilotos.filter((p) => p.teorico_apto).length, noAptos: pilotos.filter((p) => !p.teorico_apto).length },
    { name: "Práctico", aptos: pilotos.filter((p) => p.practico_apto).length, noAptos: pilotos.filter((p) => !p.practico_apto).length },
    { name: "Radiofonista", aptos: pilotos.filter((p) => p.radiofonista_apto).length, noAptos: pilotos.filter((p) => !p.radiofonista_apto).length },
  ];

  // --- Vida de baterías (200h = 100%) ---
  const vidaBaterias = baterias
    .filter((b) => b.estado !== "Desechada" && b.numero_asignado)
    .map((b) => {
      const mins = totalHorasBateria(vuelos, b.numero_asignado);
      const remaining = Math.max(0, 100 - (mins / 60 / 200 * 100));
      return { numero: b.numero_asignado, vida: Math.round(remaining) };
    })
    .sort((a, b) => {
      const aN = parseInt(a.numero, 10), bN = parseInt(b.numero, 10);
      if (!isNaN(aN) && !isNaN(bN)) return aN - bN;
      return (a.numero || "").localeCompare(b.numero || "");
    });

  // --- Baterías con baja vida (< 20%) ---
  const bateriasBajaVida = vidaBaterias.filter((b) => b.vida < 20).length;

  const kpis = [
    { label: "Aeronaves", value: aeronaves.length, sub: `${operativas} operativas`, icon: Drone, color: "text-green-700", bg: "bg-green-50" },
    { label: "Pilotos", value: pilotos.length, sub: `${pilotosOk} validados`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Baterías activas", value: bateriasActivas, sub: `${bateriasBajaVida} baja vida`, icon: BatteryCharging, color: "text-green-700", bg: "bg-green-50" },
    { label: "Vuelos registrados", value: vuelos.length, sub: "total", icon: FileText, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Horas de vuelo", value: formatDuration(totalMinutosVuelo), sub: "acumuladas", icon: Clock, color: "text-green-700", bg: "bg-green-50" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-10" id="print-area">
        <PrintHeader title="Panel Estadístico" />
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Panel Estadístico</h1>
              <p className="text-slate-500">Resumen general de la operativa UAS</p>
            </div>
          </div>
          <PrintButton />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 * i }} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${k.color}`} /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-tight">{k.value}</p>
                    <p className="text-sm text-slate-500">{k.label}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 pl-13">{k.sub}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vuelos por mes */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Vuelos por mes (últimos 6 meses)</h2>
            {vuelosPorMes.every((m) => m.vuelos === 0) ? (
              <p className="text-slate-400 text-center py-16">Sin datos de vuelos</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={vuelosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 13, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                  <Bar dataKey="vuelos" name="Vuelos" fill={GREEN} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Horas por aeronave */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Horas de vuelo por aeronave (Top 10)</h2>
            {horasPorAeronave.every((a) => a.horas === 0) ? (
              <p className="text-slate-400 text-center py-16">Sin datos de vuelos</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={horasPorAeronave} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 13, fill: "#64748b" }} unit="h" />
                  <YAxis type="category" dataKey="matricula" tick={{ fontSize: 13, fill: "#64748b" }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} formatter={(v) => [`${v}h`, "Horas"]} />
                  <Bar dataKey="horas" name="Horas" fill={GREEN_LIGHT} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Estado de baterías */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Estado de baterías activas</h2>
            {pieBaterias.length === 0 ? (
              <p className="text-slate-400 text-center py-16">Sin baterías activas</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieBaterias} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name}: ${value}`}>
                    {pieBaterias.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Certificaciones de pilotos */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Certificaciones de pilotos</h2>
            {pilotos.length === 0 ? (
              <p className="text-slate-400 text-center py-16">Sin pilotos registrados</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={certData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="aptos" name="Aptos" stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="noAptos" name="No aptos" stackId="a" fill={SLATE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Vida de baterías */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
            <h2 className="font-semibold text-slate-900 mb-4">Vida restante de baterías (sobre 200h)</h2>
            {vidaBaterias.length === 0 ? (
              <p className="text-slate-400 text-center py-16">Sin baterías activas</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, vidaBaterias.length * 36)}>
                <BarChart data={vidaBaterias} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 13, fill: "#64748b" }} unit="%" />
                  <YAxis type="category" dataKey="numero" tick={{ fontSize: 13, fill: "#64748b" }} width={50} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} formatter={(v) => [`${v}%`, "Vida restante"]} />
                  <Bar dataKey="vida" name="Vida restante" radius={[0, 6, 6, 0]}>
                    {vidaBaterias.map((entry, idx) => {
                      const color = entry.vida > 50 ? GREEN : entry.vida > 20 ? AMBER : RED;
                      return <Cell key={idx} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {bateriasBajaVida > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{bateriasBajaVida} batería(s) con menos del 20% de vida restante</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}