import db from "@/api/base44Client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Check, Loader2, ShieldAlert, Plane, BatteryCharging } from "lucide-react";
import { computeIncidencias } from "@/lib/incidencias";

export default function Incidencias() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aeronaves, baterias, mantenimientos, descartadas] = await Promise.all([
        db.entities.Aeronave.list(),
        db.entities.Bateria.list(),
        db.entities.BateriaMantenimiento.list(),
        db.entities.IncidenciaDescartada.list(),
      ]);
      const descartadasClaves = new Set(descartadas.map((d) => d.clave));
      const todas = computeIncidencias(aeronaves, baterias, mantenimientos);
      setIncidencias(todas.filter((i) => !descartadasClaves.has(i.clave)));
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (user && user.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Solo el superusuario puede ver esta página.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const descartar = async (item) => {
    setBusyKey(item.clave);
    try {
      await db.incidencias.descartar(item);
      await load();
    } catch (e) { /* ignore */ }
    finally { setBusyKey(null); }
  };

  const descartarTodas = async () => {
    if (incidencias.length === 0) return;
    if (!window.confirm(`¿Descartar los ${incidencias.length} avisos? Seguirán vencidos hasta que se actualice el mantenimiento.`)) return;
    setBusyKey("todas");
    try {
      await db.incidencias.descartarTodas(incidencias);
      await load();
    } catch (e) { /* ignore */ }
    finally { setBusyKey(null); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Avisos de mantenimiento</h1>
              <p className="text-slate-500">Aeronaves y baterías con el mantenimiento vencido</p>
            </div>
          </div>
          {incidencias.length > 0 && (
            <Button variant="outline" disabled={busyKey === "todas"} onClick={descartarTodas}>
              <Check className="w-4 h-4 mr-1" /> Descartar todas
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : incidencias.length === 0 ? (
          <div className="text-center py-20">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-slate-500">No hay avisos pendientes.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {incidencias.map((inc) => (
              <div key={inc.clave} className="bg-white rounded-xl border border-amber-200 bg-amber-50/40 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    {inc.tipo === "Aeronave" ? <Plane className="w-5 h-5 text-amber-700" /> : <BatteryCharging className="w-5 h-5 text-amber-700" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> {inc.tipo}
                    </p>
                    <p className="text-sm text-slate-600">{inc.mensaje}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled={busyKey === inc.clave} onClick={() => descartar(inc)}>
                  <Check className="w-3.5 h-3.5 mr-1" /> Descartar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
