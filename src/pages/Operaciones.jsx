import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function Operaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planesPendientes, setPlanesPendientes] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const planes = await db.entities.PlanVuelo.list();
        setPlanesPendientes(planes.filter((p) => !p.estado || p.estado === "pendiente").length);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const isAdminLevel = user?.role === "admin" || user?.role === "superadmin";

  const cards = [
    { key: "registro", label: "Registro de Vuelos", desc: "Consulta y registra vuelos", icon: FileText, path: "/aeronaves/registro", gradient: "from-green-600 to-green-800" },
    { key: "planes", label: "Planes de Vuelo Operacional", desc: isAdminLevel ? "Autoriza los planes de la unidad" : "Crea y consulta tus planes", icon: ClipboardList, path: "/planes-vuelo", gradient: "from-blue-600 to-blue-800", badge: isAdminLevel ? planesPendientes : null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Operaciones</h1>
            <p className="text-slate-500">Vuelos y planificación operacional</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.button
                key={c.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                whileHover={{ y: -6 }}
                onClick={() => navigate(c.path)}
                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-8 text-left shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg relative`}>
                    <Icon className="w-7 h-7 text-white" />
                    {c.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                        {c.badge}
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">{c.label}</h2>
                <p className="text-slate-500 text-sm">{c.desc}</p>
                <div className="mt-6 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Abrir panel →
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
