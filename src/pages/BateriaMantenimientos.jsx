import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Wrench, AlertTriangle, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import BateriaMantenimientoForm from "@/components/bateria/BateriaMantenimientoForm";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

const celdaDiff = (m) => {
  const vs = [m.voltaje_celda_1, m.voltaje_celda_2, m.voltaje_celda_3, m.voltaje_celda_4].filter((v) => v != null && !isNaN(v));
  if (vs.length < 2) return 0;
  return Math.max(...vs) - Math.min(...vs);
};

export default function BateriaMantenimientos() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.entities.BateriaMantenimiento.list("-fecha", 200);
      setItems(data);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (m) => { setEditing(m); setOpen(true); };
  const openNew = () => { setEditing(null); setOpen(true); };
  const confirmDelete = async () => {
    if (!deleting) return;
    await db.entities.BateriaMantenimiento.delete(deleting.id);
    setDeleting(null);
    load();
  };

  const filtered = items.filter((m) => {
    const q = query.toLowerCase();
    return [m.bateria_numero, m.tip, m.tipo, m.observaciones].some((v) => (v || "").toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10" id="print-area">
                <PrintHeader title="Mantenimientos de Baterías" />
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/baterias")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Mantenimientos de baterías</h1>
              <p className="text-slate-500">{filtered.length} registro(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button onClick={openNew} className="bg-green-800 hover:bg-green-900"><Plus className="w-4 h-4 mr-1" /> Nuevo</Button>
            <PrintButton />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Wrench className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No hay mantenimientos registrados.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Batería</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">TIP</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Tipo</th>
                  <th className="text-center px-4 py-3 font-medium whitespace-nowrap">C1</th>
                  <th className="text-center px-4 py-3 font-medium whitespace-nowrap">C2</th>
                  <th className="text-center px-4 py-3 font-medium whitespace-nowrap">C3</th>
                  <th className="text-center px-4 py-3 font-medium whitespace-nowrap">C4</th>
                  <th className="text-center px-4 py-3 font-medium whitespace-nowrap">Dif.</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Observaciones</th>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Próxima rev.</th>
                  <th className="text-center px-4 py-3 font-medium whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => {
                  const diff = celdaDiff(m);
                  const alerta = diff > 0.2;
                  return (
                    <tr key={m.id} className={alerta ? "bg-red-50" : "hover:bg-slate-50"}>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{m.bateria_numero}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{m.fecha || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{m.tip || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{m.tipo || "—"}</td>
                      <td className="px-4 py-3 text-center">{m.voltaje_celda_1 ?? "—"}</td>
                      <td className="px-4 py-3 text-center">{m.voltaje_celda_2 ?? "—"}</td>
                      <td className="px-4 py-3 text-center">{m.voltaje_celda_3 ?? "—"}</td>
                      <td className="px-4 py-3 text-center">{m.voltaje_celda_4 ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {alerta ? (
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium"><AlertTriangle className="w-3.5 h-3.5" /> {diff.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-500">{diff.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{m.observaciones || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          if (!m.proxima_fecha) return "—";
                          const daysUntil = Math.ceil((new Date(m.proxima_fecha) - new Date(new Date().toISOString().slice(0, 10))) / (1000 * 60 * 60 * 24));
                          if (daysUntil < 0) return <span className="text-red-600 font-medium">{m.proxima_fecha}</span>;
                          if (daysUntil <= 30) return <span className="text-green-700 font-medium">{m.proxima_fecha}</span>;
                          return m.proxima_fecha;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => setDeleting(m)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BateriaMantenimientoForm open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }} onSaved={load} editing={editing} />

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar mantenimiento</DialogTitle></DialogHeader>
          <p className="text-slate-600 text-sm">¿Seguro que deseas eliminar el mantenimiento de la batería <strong>{deleting?.bateria_numero}</strong> del <strong>{deleting?.fecha}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}