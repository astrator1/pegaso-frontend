import db from "@/api/base44Client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, BatteryCharging, Plus, LogOut, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

import { Drone } from "@/components/DroneIcon";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [counts, setCounts] = useState({ pilotos: null, aeronaves: null, baterias: null });

  React.useEffect(() => {
    (async () => {
      try {
        const [p, a, b] = await Promise.all([
        db.entities.Piloto.list(),
        db.entities.Aeronave.list(),
        db.entities.Bateria.list()]
        );
        setCounts({ pilotos: p.length, aeronaves: a.length, baterias: b.length });
      } catch (e) {

        // ignore load errors
      }})();}, []);const cards = [{ key: "pilotos", label: "Pilotos", desc: "Gestión de pilotos", icon: Users, count: counts.pilotos, path: "/pilotos", gradient: "from-green-600 to-green-800" }, { key: "aeronaves", label: "Aeronaves", desc: "Gestión de aeronaves", icon: Drone, count: counts.aeronaves, path: "/aeronaves", gradient: "from-green-600 to-green-800" },
  { key: "baterias", label: "Baterías", desc: "Gestión de baterías", icon: BatteryCharging, count: counts.baterias, path: "/baterias", gradient: "from-green-600 to-green-800" }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative rounded opacity-100">
      <div className="absolute top-6 right-6 no-print flex gap-2">
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
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12">
          
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">MENÚ PRINCIPAL</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Pegaso Control UAS</h1>
          <p className="text-slate-500 mt-3 text-lg">Gestiona pilotos, aeronaves y baterías desde un único panel.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-8 text-left shadow-sm hover:shadow-xl transition-shadow">
                
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-5xl font-bold text-slate-100 group-hover:text-slate-200 transition-colors">
                    {c.count === null ? "—" : c.count}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-1">{c.label}</h2>
                <p className="text-slate-500">{c.desc}</p>
                <div className="mt-6 flex items-center text-sm font-medium text-slate-700 group-hover:text-slate-900">
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