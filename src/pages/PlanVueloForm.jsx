import db from "@/api/base44Client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import SiNoNa from "@/components/SiNoNa";
import ImageField from "@/components/ImageField";
import PrintButton from "@/components/PrintButton";
import PrintHeader from "@/components/PrintHeader";
import { ArrowLeft, Loader2, Check, X, Radio } from "lucide-react";
import { CHECKLIST_04, CHECKLIST_06, initRespuestas } from "@/lib/checklistPlanVuelo";

const EMPTY = {
  titulo: "",
  descripcion_objetivos: "",
  fecha_prevista: "",
  hora_prevista: "",
  notas_fecha: "",
  piloto_al_mando_id: "",
  personal_necesario_ids: [],
  uas_previsto_id: "",
  medios_materiales: "",
  direccion: "",
  coordenadas: "",
  imagen_espacio_aereo: null,
  imagen_zona_operaciones: null,
  respuestas_04: initRespuestas(CHECKLIST_04),
  respuestas_06: initRespuestas(CHECKLIST_06),
};

function ChecklistSection({ codigoTitulo, titulo, checklist, respuestas, setRespuestas, editable, pilotoAlMando }) {
  const setGrupoValor = (grupoKey, valor) =>
    setRespuestas((prev) => ({ ...prev, [grupoKey]: { ...prev[grupoKey], valor } }));
  const setItemValor = (grupoKey, itemKey, valor) =>
    setRespuestas((prev) => ({ ...prev, [grupoKey]: { ...prev[grupoKey], items: { ...prev[grupoKey].items, [itemKey]: valor } } }));
  const setItemTexto = (grupoKey, itemKey, texto) =>
    setRespuestas((prev) => ({ ...prev, [grupoKey]: { ...prev[grupoKey], items: { ...prev[grupoKey].items, [`${itemKey}_texto`]: texto } } }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{codigoTitulo} {titulo}</h2>
      {checklist.map((grupo) => (
        <div key={grupo.key} className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between bg-slate-100 px-4 py-2.5">
            <span className="font-medium text-slate-800 text-sm">
              <span className="text-slate-400 mr-2">{grupo.codigo}</span>{grupo.label}
            </span>
            <SiNoNa value={respuestas[grupo.key]?.valor} onChange={(v) => setGrupoValor(grupo.key, v)} disabled={!editable} />
          </div>
          <div className="divide-y divide-slate-100">
            {grupo.items.map((item) => {
              if (item.auto) {
                const apto = pilotoAlMando?.radiofonista_apto;
                return (
                  <div key={item.key} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-slate-600 flex-1 pr-4">
                      <span className="text-slate-400 mr-2">{item.codigo}</span>{item.label}
                    </span>
                    {!pilotoAlMando ? (
                      <span className="text-xs text-slate-400 shrink-0">Elige el piloto al mando</span>
                    ) : apto ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shrink-0">
                        <Check className="w-3 h-3 mr-1" /> Sí{pilotoAlMando.radiofonista_fecha ? ` (${pilotoAlMando.radiofonista_fecha})` : ""}
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 shrink-0">
                        <X className="w-3 h-3 mr-1" /> No
                      </Badge>
                    )}
                  </div>
                );
              }
              if (item.freeText) {
                return (
                  <div key={item.key} className="px-4 py-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        <span className="text-slate-400 mr-2">{item.codigo}</span>Otras limitaciones (descríbelas si aplica)
                      </span>
                      <SiNoNa value={respuestas[grupo.key]?.items?.[item.key]} onChange={(v) => setItemValor(grupo.key, item.key, v)} disabled={!editable} />
                    </div>
                    <Textarea
                      rows={2}
                      disabled={!editable}
                      value={respuestas[grupo.key]?.items?.[`${item.key}_texto`] || ""}
                      onChange={(e) => setItemTexto(grupo.key, item.key, e.target.value)}
                      placeholder="Detalle de la limitación..."
                    />
                  </div>
                );
              }
              return (
                <div key={item.key} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-slate-600 flex-1 pr-4">
                    <span className="text-slate-400 mr-2">{item.codigo}</span>{item.label}
                  </span>
                  <SiNoNa value={respuestas[grupo.key]?.items?.[item.key]} onChange={(v) => setItemValor(grupo.key, item.key, v)} disabled={!editable} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PlanVueloForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isNew = !id;
  const isAdminLevel = user?.role === "admin" || user?.role === "superadmin";

  const [form, setForm] = useState(EMPTY);
  const [plan, setPlan] = useState(null);
  const [pilotos, setPilotos] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [comentarioDecision, setComentarioDecision] = useState("");
  const [decidiendo, setDecidiendo] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([db.entities.Piloto.list(), db.entities.Aeronave.list()]);
      setPilotos(p); setAeronaves(a);
      if (!isNew) {
        const data = await db.entities.PlanVuelo.get(id);
        setPlan(data);
        setForm({
          ...EMPTY,
          ...data,
          respuestas_04: { ...initRespuestas(CHECKLIST_04), ...(data.respuestas_04 || {}) },
          respuestas_06: { ...initRespuestas(CHECKLIST_06), ...(data.respuestas_06 || {}) },
          personal_necesario_ids: data.personal_necesario_ids || [],
        });
      }
    } catch (err) {
      setError(err.message || "No se pudo cargar el plan de vuelo");
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { load(); }, [load]);

  const editable = isNew || plan?.estado === "pendiente" || !plan?.estado;
  const readOnly = !isNew && !editable;

  const pilotoAlMando = pilotos.find((p) => p.id === form.piloto_al_mando_id) || null;

  const togglePersonal = (pid) => {
    setForm((f) => {
      const has = f.personal_necesario_ids.includes(pid);
      return { ...f, personal_necesario_ids: has ? f.personal_necesario_ids.filter((x) => x !== pid) : [...f.personal_necesario_ids, pid] };
    });
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { setError("El título es obligatorio"); return; }
    if (!form.piloto_al_mando_id) { setError("Selecciona el piloto al mando"); return; }
    if (!form.uas_previsto_id) { setError("Selecciona el UAS previsto"); return; }
    setSaving(true);
    setError("");
    try {
      if (isNew) {
        const created = await db.entities.PlanVuelo.create({ ...form, estado: "pendiente" });
        navigate(`/planes-vuelo/${created.id}`);
      } else {
        await db.entities.PlanVuelo.update(id, form);
        await load();
      }
    } catch (err) {
      setError(err.message || "No se pudo guardar el plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDecidir = async (estado) => {
    setDecidiendo(true);
    setError("");
    try {
      await db.planVuelo.decidir(id, estado, comentarioDecision);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo registrar la decisión");
    } finally {
      setDecidiendo(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10" id="print-area">
        <PrintHeader title={`Plan de Vuelo Operacional — ${form.titulo || "Sin título"}`} />
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/planes-vuelo")}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{isNew ? "Nuevo Plan de Vuelo Operacional" : form.titulo || "Plan de Vuelo Operacional"}</h1>
              {plan?.estado && (
                <Badge className={
                  plan.estado === "aprobado" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                  plan.estado === "rechazado" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                  "bg-amber-100 text-amber-700 hover:bg-amber-100"
                }>
                  {plan.estado === "aprobado" ? "Aprobado" : plan.estado === "rechazado" ? "Rechazado" : "Pendiente"}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isNew && <PrintButton />}
            {editable && (
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                {isNew ? "Crear plan" : "Guardar cambios"}
              </Button>
            )}
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm no-print">{error}</div>}

        {readOnly && (
          <div className="mb-6 p-4 rounded-lg bg-slate-100 text-slate-600 text-sm no-print">
            Este plan ya ha sido {plan.estado === "aprobado" ? "aprobado" : "rechazado"} y no se puede editar.
          </div>
        )}

        <div className="space-y-8">
          {/* 0.1 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">0.1 Información sobre las operaciones</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Título y/o código</Label>
                <Input disabled={!editable} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Descripción y objetivos</Label>
                <Textarea rows={3} disabled={!editable} value={form.descripcion_objetivos} onChange={(e) => set("descripcion_objetivos", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fecha prevista</Label>
                  <Input type="date" disabled={!editable} value={form.fecha_prevista} onChange={(e) => set("fecha_prevista", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Hora prevista</Label>
                  <Input type="time" disabled={!editable} value={form.hora_prevista} onChange={(e) => set("hora_prevista", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notas sobre fechas/horas <span className="text-slate-400 font-normal">(si hay varias, o una ventana horaria)</span></Label>
                <Input disabled={!editable} value={form.notas_fecha} onChange={(e) => set("notas_fecha", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Piloto al mando</Label>
                <Select disabled={!editable} value={form.piloto_al_mando_id} onValueChange={(v) => set("piloto_al_mando_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona piloto al mando" /></SelectTrigger>
                  <SelectContent>
                    {pilotos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellidos}</SelectItem>)}
                  </SelectContent>
                </Select>
                {pilotoAlMando && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Radio className="w-3 h-3" /> Radiofonista: {pilotoAlMando.radiofonista_apto ? "Sí" : "No"}
                    {pilotoAlMando.radiofonista_apto && pilotoAlMando.radiofonista_fecha ? ` (obtenido ${pilotoAlMando.radiofonista_fecha})` : ""}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Personal necesario</Label>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {pilotos.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                      <Checkbox
                        disabled={!editable}
                        checked={form.personal_necesario_ids.includes(p.id)}
                        onCheckedChange={() => togglePersonal(p.id)}
                      />
                      {p.nombre} {p.apellidos}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>UAS previsto</Label>
                <Select disabled={!editable} value={form.uas_previsto_id} onValueChange={(v) => set("uas_previsto_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona aeronave" /></SelectTrigger>
                  <SelectContent>
                    {aeronaves.map((a) => <SelectItem key={a.id} value={a.id}>{a.marca} {a.modelo} ({a.matricula})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Medios materiales específicos requeridos</Label>
                <Textarea rows={2} disabled={!editable} value={form.medios_materiales} onChange={(e) => set("medios_materiales", e.target.value)} />
              </div>
            </div>
          </div>

          {/* 0.2 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">0.2 Evaluación del escenario de operaciones</h2>
            <div className="grid gap-4">
              <div className="grid gap-2"><Label>Dirección</Label><Input disabled={!editable} value={form.direccion} onChange={(e) => set("direccion", e.target.value)} /></div>
              <div className="grid gap-2"><Label>Coordenadas aprox.</Label><Input disabled={!editable} value={form.coordenadas} onChange={(e) => set("coordenadas", e.target.value)} /></div>
            </div>
          </div>

          {/* 0.3 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">0.3 Espacio aéreo</h2>
            <ImageField label="Captura de ENAIRE Drones" value={form.imagen_espacio_aereo} onChange={(v) => set("imagen_espacio_aereo", v)} disabled={!editable} />
          </div>

          {/* 0.4 */}
          <ChecklistSection
            codigoTitulo="0.4" titulo="Requisitos y limitaciones al vuelo por motivos de espacio aéreo"
            checklist={CHECKLIST_04} respuestas={form.respuestas_04}
            setRespuestas={(fn) => setForm((f) => ({ ...f, respuestas_04: typeof fn === "function" ? fn(f.respuestas_04) : fn }))}
            editable={editable} pilotoAlMando={pilotoAlMando}
          />

          {/* 0.5 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">0.5 Zona de vuelo</h2>
            <ImageField label="Mapa de la zona de operaciones" value={form.imagen_zona_operaciones} onChange={(v) => set("imagen_zona_operaciones", v)} disabled={!editable} />
          </div>

          {/* 0.6 */}
          <ChecklistSection
            codigoTitulo="0.6" titulo="Requisitos y limitaciones en la zona de vuelo"
            checklist={CHECKLIST_06} respuestas={form.respuestas_06}
            setRespuestas={(fn) => setForm((f) => ({ ...f, respuestas_06: typeof fn === "function" ? fn(f.respuestas_06) : fn }))}
            editable={editable} pilotoAlMando={pilotoAlMando}
          />

          {/* 0.6.5 Aprobación */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">0.6.5 Aprobación del responsable de planificación</h2>
            {!isNew && plan?.estado && plan.estado !== "pendiente" ? (
              <div className="rounded-xl border border-slate-200 p-4 space-y-1 text-sm">
                <p><span className="font-medium">Decisión:</span> {plan.estado === "aprobado" ? "Aprobado" : "Rechazado"}</p>
                <p><span className="font-medium">Firmado por:</span> {plan.aprobado_por}</p>
                <p><span className="font-medium">Fecha:</span> {plan.fecha_decision ? new Date(plan.fecha_decision).toLocaleString("es-ES") : "-"}</p>
                {plan.comentario_aprobacion && <p><span className="font-medium">Comentario:</span> {plan.comentario_aprobacion}</p>}
              </div>
            ) : !isNew && isAdminLevel ? (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 no-print">
                <Label>Comentario (opcional)</Label>
                <Textarea rows={2} value={comentarioDecision} onChange={(e) => setComentarioDecision(e.target.value)} placeholder="Observaciones sobre la decisión..." />
                <div className="flex gap-2">
                  <Button disabled={decidiendo} onClick={() => handleDecidir("aprobado")} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-1" /> Aprobar
                  </Button>
                  <Button disabled={decidiendo} variant="outline" onClick={() => handleDecidir("rechazado")} className="text-red-600 border-red-200 hover:bg-red-50">
                    <X className="w-4 h-4 mr-1" /> Rechazar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Pendiente de aprobación por un responsable de planificación.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
