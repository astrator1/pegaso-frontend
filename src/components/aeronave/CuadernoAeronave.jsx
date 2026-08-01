import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

import { flightDuration, formatDuration, totalHorasMatricula } from "@/lib/vuelo";

const ESCUDO_URL = "https://media.db.com/images/public/6a61e441db2209bf639e1a0a/06c0c4790_Emblem_of_the_Guardia_Civils_Air_Servicesvg.webp";

export default function CuadernoAeronave({ aeronave }) {
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!aeronave?.matricula) { setLoading(false); return; }
      try {
        const data = await db.entities.Vuelo.list("-created_date", 500);
        setVuelos(data.filter((v) => v.matricula === aeronave.matricula).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")));
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [aeronave?.matricula]);

  const total = totalHorasMatricula(vuelos, aeronave?.matricula);

  if (loading) return <div className="text-center py-10 text-slate-400">Cargando...</div>;
  if (!aeronave) return null;

  return (
    <div>
      {/* Carátula - página de portada centrada */}
      <div className="flex flex-col items-center justify-center text-center cover-page min-h-[70vh] py-4">
        {/* Logo - 9cm de ancho, proporcional */}
        <img src={ESCUDO_URL} alt="Emblema Guardia Civil" style={{ width: "9cm", maxWidth: "80%", height: "auto", marginBottom: "1.5rem" }} />

        {/* Texto */}
        <h1 style={{ fontSize: "32px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "5px", margin: 0, color: "#1e293b" }}>GUARDIA CIVIL</h1>
        <h2 style={{ fontSize: "20px", fontWeight: "600", margin: "8px 0 0 0", color: "#475569", letterSpacing: "2px" }}>LIBRO DE AERONAVE</h2>

        {/* Datos de la aeronave */}
        <div className="mt-10 grid grid-cols-2 gap-4" style={{ width: "70%", maxWidth: "500px" }}>
          <div className="border border-slate-300 rounded-lg p-3 text-center">
            <span className="text-slate-500 text-xs block mb-1">Marca y modelo</span>
            <span className="font-semibold text-slate-900 text-sm">{aeronave.marca} {aeronave.modelo}</span>
          </div>
          <div className="border border-slate-300 rounded-lg p-3 text-center">
            <span className="text-slate-500 text-xs block mb-1">S/N</span>
            <span className="font-semibold text-slate-900 text-sm">{aeronave.numero_serie || "—"}</span>
          </div>
          <div className="border border-slate-300 rounded-lg p-3 text-center">
            <span className="text-slate-500 text-xs block mb-1">MATRÍCULA</span>
            <span className="font-semibold text-slate-900 text-sm">{aeronave.matricula}</span>
          </div>
          <div className="border border-slate-300 rounded-lg p-3 text-center">
            <span className="text-slate-500 text-xs block mb-1">CALLSIGN</span>
            <span className="font-semibold text-slate-900 text-sm">{aeronave.callsign || "—"}</span>
          </div>
        </div>
      </div>

      {/* Registro de vuelo - nueva página al imprimir */}
      <div className="page-break-before">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-900" style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>REGISTRO DE VUELO</h3>
        <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">Total: {formatDuration(total)}</span>
      </div>

      {vuelos.length === 0 ? (
        <div className="text-center py-10 text-slate-400"><BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />Sin vuelos registrados para esta aeronave.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100 text-left text-slate-700">
                <th className="px-2 py-2 font-semibold whitespace-nowrap">Fecha</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">Piloto</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">Misión</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">Lugar</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">Batería</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">H. Desp.</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">H. Ater.</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">Dur.</th>
                <th className="px-2 py-2 font-semibold text-center whitespace-nowrap">Pre</th>
                <th className="px-2 py-2 font-semibold text-center whitespace-nowrap">Pos</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">Observaciones</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">TIP</th>
                <th className="px-2 py-2 font-semibold whitespace-nowrap">Firma</th>
              </tr>
            </thead>
            <tbody>
              {vuelos.map((v) => {
                const dur = flightDuration(v.hora_despegue, v.hora_aterrizaje);
                return (
                  <tr key={v.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 text-slate-900 whitespace-nowrap">{v.fecha || "—"}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{v.piloto || "—"}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{v.mision || "—"}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{v.lugar || "—"}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{v.bateria || "—"}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{v.hora_despegue || "—"}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{v.hora_aterrizaje || "—"}</td>
                    <td className="px-2 py-2 font-medium text-slate-900 whitespace-nowrap">{formatDuration(dur)}</td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">{v.pre_vuelo ? "✓" : "—"}</td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">{v.pos_vuelo ? "✓" : "—"}</td>
                    <td className="px-2 py-2 text-slate-600">{v.observaciones || "—"}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{v.tip_piloto || "—"}</td>
                    <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{v.firma || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Nota sobre rotables y mantenimiento */}
      <div className="mt-4 text-xs text-slate-500 border-t border-slate-200 pt-3">
        <p>En caso de rotables y otros componentes con vida limitada, la situación y los ciclos/horas/vida residual podrá realizarse en un listado adicional, indicando su situación como operación de mantenimiento. Es necesario incluir las actualizaciones de Software como una acción de mantenimiento. Los cambios de equipo de misión para las distintas actividades deben tratarse igualmente como operaciones de mantenimiento.</p>
      </div>
      </div>
    </div>
  );
}