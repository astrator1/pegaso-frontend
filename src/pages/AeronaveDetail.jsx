import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Wrench, Package, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Drone } from "@/components/DroneIcon";
import CuadernoAeronave from "@/components/aeronave/CuadernoAeronave";
import MantenimientoTab from "@/components/aeronave/MantenimientoTab";
import MaterialTab from "@/components/aeronave/MaterialTab";
import ModificacionesTab from "@/components/aeronave/ModificacionesTab";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

export default function AeronaveDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [aeronave, setAeronave] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await db.entities.Aeronave.get(id);
        setAeronave(data);
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!aeronave) return <div className="min-h-screen flex items-center justify-center text-slate-400">Aeronave no encontrada</div>;

  const initialTab = searchParams.get("tab") || "cuaderno";
  const matricula = aeronave.matricula;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="flex items-center gap-4 mb-8 no-print">
          <Button variant="ghost" size="icon" onClick={() => navigate("/aeronaves/gestion")}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center"><Drone className="w-5 h-5 text-green-700" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{matricula}</h1>
              <p className="text-slate-500">{aeronave.marca} {aeronave.modelo}{aeronave.callsign ? ` · CS ${aeronave.callsign}` : ""}{aeronave.numero_serie ? ` · S/N ${aeronave.numero_serie}` : ""}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${aeronave.operativa !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{aeronave.operativa !== false ? "Operativa" : "No operativa"}</span><PrintButton /></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <Tabs defaultValue={initialTab}>
            <TabsList className="mb-6 no-print">
              <TabsTrigger value="cuaderno" className="gap-1.5"><BookOpen className="w-4 h-4 text-green-800" /> Cuaderno de aeronave</TabsTrigger>
              <TabsTrigger value="mantenimiento" className="gap-1.5"><Wrench className="w-4 h-4 text-green-600" /> Mantenimiento</TabsTrigger>
              <TabsTrigger value="material" className="gap-1.5"><Package className="w-4 h-4 text-green-500" /> Material</TabsTrigger>
              <TabsTrigger value="modificaciones" className="gap-1.5"><Cog className="w-4 h-4 text-emerald-600" /> Modificaciones</TabsTrigger>
            </TabsList>
            <TabsContent value="cuaderno"><div id="print-area"><CuadernoAeronave aeronave={aeronave} /></div></TabsContent>
            <TabsContent value="mantenimiento"><div id="print-area"><PrintHeader title={`Mantenimiento — ${matricula}`} /><MantenimientoTab matricula={matricula} /></div></TabsContent>
            <TabsContent value="material"><div id="print-area"><PrintHeader title={`Material — ${matricula}`} /><MaterialTab matricula={matricula} /></div></TabsContent>
            <TabsContent value="modificaciones"><div id="print-area"><PrintHeader title={`Modificaciones — ${matricula}`} /><ModificacionesTab matricula={matricula} /></div></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}