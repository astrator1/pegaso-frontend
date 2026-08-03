import db from "@/api/base44Client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Target, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";

export default function Misiones() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.entities.Mision.list("nombre", 200);
      setItems(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setNombre(""); setDescripcion(""); setOpen(true); };
  const openEdit = (item) => { setEditing(item); setNombre(item.nombre || ""); setDescripcion(item.descripcion || ""); setOpen(true); };

  const save = async () => {
    if (!nombre.trim()) return;
    const payload = { nombre: nombre.trim(), descripcion: descripcion.trim() };
    if (editing) await db.entities.Mision.update(editing.id, payload);
    else await db.entities.Mision.create(payload);
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar esta misión del catálogo?")) return;
    await db.entities.Mision.delete(id);
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10" id="print-area">
        <PrintHeader title="Misiones" />
        <div className="flex items-center justify-between mb-8 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Misiones</h1>
              <p className="text-slate-500">{items.length} misión(es) en el catálogo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1" /> Nueva misión</Button>
            <PrintButton />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Target className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No hay misiones en el catálogo todavía.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((it, i) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.03 * i }}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Target className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h3 className="font-medium text-slate-900">{it.nombre}</h3>
                    {it.descripcion && <p className="text-sm text-slate-500">{it.descripcion}</p>}
                  </div>
                </div>
                <div className="flex gap-2 no-print">
                  <Button variant="outline" size="sm" onClick={() => openEdit(it)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => remove(it.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar misión" : "Nueva misión"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Vigilancia fronteriza" autoFocus />
            </div>
            <div className="grid gap-2">
              <Label>Descripción <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalles sobre en qué consiste esta misión..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-blue-600 hover:bg-blue-700">{editing ? "Guardar" : "Crear misión"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
