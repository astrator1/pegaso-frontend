import db from "@/api/base44Client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, BatteryCharging, LogOut, ShieldCheck, KeyRound, BarChart3, Target, ClipboardList, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { computeIncidencias } from "@/lib/incidencias";

import { Drone } from "@/components/DroneIcon";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isRestrictedUser = user?.role === "user";
  const [counts, setCounts] = useState({ pilotos: null, aeronaves: null, baterias: null, misiones: null });
  const [planesPendientes, setPlanesPendientes] = useState(null);
  const [incidenciasCount, setIncidenciasCount] = useState({ Aeronave: 0, Bateria: 0 });

  React.useEffect(() => {
    if (isRestrictedUser) return; // un piloto no necesita estos totales, solo accede a "Grabar vuelo"
    const isAdminLevel = user?.role === "admin" || user?.role === "superadmin";
    (async () => {
      try {
        const [p, a, b, m, mantenimientos, descartadas, planes, vuelos] = await Promise.all([
          db.entities.Piloto.list(),
          db.entities.Aeronave.list(),
          db.entities.Bateria.list(),
          db.entities.Mision.list(),
          isAdminLevel ? db.entities.BateriaMantenimiento.list() : Promise.resolve([]),
          isAdminLevel ? db.entities.IncidenciaDescartada.list() : Promise.resolve([]),
          isAdminLevel ? db.entities.PlanVuelo.list() : Promise.resolve([]),
          isAdminLevel ? db.entities.Vuelo.list() : Promise.resolve([]),
        ]);

        setCounts({ pilotos: p.filter((x) => x.gestionado !== false).length, aeronaves: a.filter((x) => !x.retirada).length, baterias: b.filter((x) => x.estado !== "Desechada").length, misiones: m.length });

        if (isAdminLevel) {
          const descartadasClaves = new Set(descartadas.map((d) => d.clave));
          const activas = computeIncidencias(a, b, mantenimientos).filter((i) => !descartadasClaves.has(i.clave));
          setIncidenciasCount({
            Aeronave: activas.filter((i) => i.tipo === "Aeronave").length,
            Bateria: activas.filter((i) => i.tipo === "Batería").length,
          });

          const planesPend = planes.filter((pl) => !pl.estado || pl.estado === "pendiente").length;
          const vuelosPend = vuelos.filter((v) => !v.estado || v.estado === "pendiente").length;
          setPlanesPendientes(planesPend + vuelosPend);
        }
      } catch (e) {
        // ignore load errors
      }
    })();
  }, [isRestrictedUser, user]);

  const cards = isRestrictedUser ?
  [{ key: "operaciones", label: "Operaciones", desc: "Registrar vuelo y Plan de Vuelo Operacional", icon: ClipboardList, count: null, path: "/operaciones", gradient: "from-blue-600 to-blue-800" }] :
  [{ key: "pilotos", label: "Pilotos", desc: "Gestión de pilotos", icon: Users, count: counts.pilotos, path: "/pilotos", gradient: "from-green-600 to-green-800" }, { key: "aeronaves", label: "Aeronaves", desc: "Gestión de aeronaves", icon: Drone, count: counts.aeronaves, path: "/aeronaves", gradient: "from-green-600 to-green-800", warning: incidenciasCount.Aeronave },
  { key: "baterias", label: "Baterías", desc: "Gestión de baterías", icon: BatteryCharging, count: counts.baterias, path: "/baterias", gradient: "from-green-600 to-green-800", warning: incidenciasCount.Bateria },
  { key: "misiones", label: "Misiones", desc: "Catálogo de misiones", icon: Target, count: counts.misiones, path: "/misiones", gradient: "from-green-600 to-green-800" },
  { key: "operaciones", label: "Operaciones", desc: "Vuelos y planes operacionales", icon: ClipboardList, count: null, path: "/operaciones", gradient: "from-blue-600 to-blue-800", warning: planesPendientes },
  { key: "panel", label: "Panel Estadístico", desc: "Gráficas e indicadores de la flota", icon: BarChart3, count: null, path: "/panel", gradient: "from-purple-600 to-purple-800" }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative rounded opacity-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-end gap-2 mb-4 no-print">
          {user?.role === "superadmin" && (incidenciasCount.Aeronave + incidenciasCount.Bateria) > 0 && (
            <Button variant="outline" size="sm" className="text-amber-700 border-amber-200 hover:bg-amber-50" onClick={() => navigate("/incidencias")}>
              <AlertTriangle className="w-4 h-4" /> Avisos ({incidenciasCount.Aeronave + incidenciasCount.Bateria})
            </Button>
          )}
          {(user?.role === "admin" || user?.role === "superadmin") && (
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/usuarios")}>
              <ShieldCheck className="w-4 h-4" /> Usuarios
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate("/cambiar-contrasena")}>
            <KeyRound className="w-4 h-4" /> Mi contraseña
          </Button>
          <Button variant="outline" size="sm" onClick={() => db.auth.logout(true)}><LogOut className="w-4 h-4" /> Cerrar sesión</Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8">
          
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">MENÚ PRINCIPAL</p>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Pegaso Control UAS</h1>
            <img src="/logo-pegaso.gif" alt="Unidad Pegaso" className="h-14 md:h-16 w-auto" />
          </div>
          <p className="text-slate-500 mt-2 text-base">Gestiona pilotos, aeronaves y baterías desde un único panel.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.button
                key={c.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
                whileHover={{ y: -6 }}
                onClick={() => navigate(c.path)}
                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 text-left shadow-sm hover:shadow-xl transition-shadow">
                
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg relative`}>
                    <Icon className="w-6 h-6 text-white" />
                    {c.warning > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white" title="Mantenimiento vencido">
                        {c.warning}
                      </span>
                    )}
                  </div>
                  {c.count !== null && c.count !== undefined && (
                    <span className="text-4xl font-bold text-slate-100 group-hover:text-slate-200 transition-colors tabular-nums">
                      {c.count}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">{c.label}</h2>
                <p className="text-slate-500 text-sm">{c.desc}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Acceder al panel
                  
                </div>
              </motion.button>);

          })}
        </div>
      </div>
      <div className="absolute bottom-3 right-4 text-xs text-slate-300 select-none no-print">
        DNT
      </div>
    </div>);

}