import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BatteryCharging, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Baterias() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await db.entities.Bateria.list();
        setCount(data.filter((b) => b.estado !== "Desechada").length);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const cards = [
    { title: "Gestión de baterías", desc: "Alta, edición y descarte de baterías", icon: BatteryCharging, path: "/baterias/gestion", color: "text-green-700 bg-green-50" },
    { title: "Mantenimientos", desc: "Listado de mantenimientos de todas las baterías", icon: Wrench, path: "/baterias/mantenimientos", color: "text-green-700 bg-green-50" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Baterías</h1>
            <p className="text-slate-500">{count} batería(s) activa(s)</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.button
                key={c.path}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
                onClick={() => navigate(c.path)}
                className="bg-white rounded-xl border border-slate-200 p-6 text-left shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{c.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}