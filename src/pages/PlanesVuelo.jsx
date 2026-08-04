import db from "@/api/base44Client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, ClipboardList, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

function EstadoBadge({ estado }) {
  if (estado === "aprobado") return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aprobado</Badge>;
  if (estado === "rechazado") return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rechazado</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>;
}

export default function PlanesVuelo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminLevel = user?.role === "admin" || user?.role === "superadmin";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.entities.PlanVuelo.list("-created_date", 500);
      setItems(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendientes = items.filter((p) => !p.estado || p.estado === "pendiente");
  const decididos = items.filter((p) => p.estado && p.estado !== "pendiente");

  const Row = ({ p }) => (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/planes-vuelo/${p.id}`)}
      className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
    >
      <div>
        <p className="font-medium text-slate-900">{p.titulo || "Sin título"}</p>
        <p className="text-sm text-slate-500">
          {p.fecha_prevista || "Sin fecha"} {p.hora_prevista ? `· ${p.hora_prevista}` : ""}
          {isAdminLevel && p.created_by_email ? ` · ${p.created_by_email}` : ""}
        </p>
      </div>
      <EstadoBadge estado={p.estado} />
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/operaciones")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Planes de Vuelo Operacional</h1>
              <p className="text-slate-500">{isAdminLevel ? "Revisa y autoriza los planes de la unidad" : "Tus planes de vuelo"}</p>
            </div>
          </div>
          <Button onClick={() => navigate("/planes-vuelo/nuevo")} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-1" /> Nuevo plan
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Todavía no hay planes de vuelo.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Pendientes {pendientes.length > 0 && <Badge variant="secondary">{pendientes.length}</Badge>}
              </h2>
              {pendientes.length === 0 ? (
                <p className="text-sm text-slate-400">No hay planes pendientes.</p>
              ) : (
                <div className="grid gap-3">{pendientes.map((p) => <Row key={p.id} p={p} />)}</div>
              )}
            </section>
            {decididos.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Resueltos</h2>
                <div className="grid gap-3">{decididos.map((p) => <Row key={p.id} p={p} />)}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
