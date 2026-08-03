// Checklist de planificación operacional (Apéndice 7 del Manual de Operaciones).
// Cada grupo tiene su propio Sí/No/N-A, y dentro, sus puntos de detalle.
// El punto "radiofonista" es especial: no lo marca el piloto, se calcula solo
// a partir de los datos del Piloto al mando (ver PlanVueloForm.jsx).

export const CHECKLIST_04 = [
  {
    key: "op_espacio_controlado",
    codigo: "0.4.1",
    label: "Operaciones en espacio aéreo controlado o FIZ",
    items: [
      { key: "radiofonista", codigo: "0.4.1.1", label: "El piloto cuenta con calificación de radiofonista aeronáutico.", auto: true },
      { key: "equipo_comunicaciones", codigo: "0.4.1.2", label: "Se dispone de equipo de comunicaciones aeronáuticas." },
      { key: "estudio_earo", codigo: "0.4.1.3", label: "Se cuenta con un estudio aeronáutico de seguridad específico coordinado con el proveedor de servicios de tránsito aéreo (formato EARO)." },
    ],
  },
  {
    key: "op_proximidad_aerodromos",
    codigo: "0.4.2",
    label: "Operaciones en las proximidades de aeródromos",
    items: [
      { key: "distancia_infraestructuras", codigo: "0.4.2.1", label: "Se mantiene la distancia mínima a dichas infraestructuras o se ha realizado una coordinación previa con el gestor de la infraestructura y proveedor ATS si lo hubiera." },
    ],
  },
  {
    key: "zonas_prdf",
    codigo: "0.4.3",
    label: "Vuelo en zonas prohibidas, restringidas, peligrosas y de fauna sensible (P, R, D y F)",
    items: [
      { key: "condiciones_zona", codigo: "0.4.3.1", label: "Se cumple con las condiciones establecidas para operar en dichas zonas o se cuenta con la autorización pertinente del gestor del área." },
    ],
  },
  {
    key: "zrvf",
    codigo: "0.4.4",
    label: "Vuelo en Zona Restringida al Vuelo Fotográfico (ZRVF)",
    items: [
      { key: "permiso_cecaf", codigo: "0.4.4.1", label: "Se cuenta con el permiso del CECAF para la toma de imágenes y datos aéreos." },
    ],
  },
  {
    key: "notams",
    codigo: "0.4.5",
    label: "NOTAMs",
    items: [
      { key: "revision_notams", codigo: "0.4.5.1", label: "Se revisan los NOTAMs activos y no existen limitaciones a la operación." },
      { key: "solicitud_notam", codigo: "0.4.5.2", label: "Si la operación debe realizarse en TSA o está condicionada a la publicación previa de NOTAM, se solicita al COP de ENAIRE su promulgación." },
    ],
  },
];

export const CHECKLIST_06 = [
  {
    key: "conops_modelo",
    codigo: "0.6.1",
    label: "CONOPS y modelo semántico",
    items: [
      { key: "modelo_semantico", codigo: "0.6.1.1", label: "Se aplica e identifica el modelo semántico en la zona de vuelo y este se ajusta al CONOPS autorizado." },
      { key: "geografia_vuelo", codigo: "0.6.1.2", label: "Se define la geografía del vuelo junto con el perfil de vuelos en función del CONOPS (alcance máximo, altura máxima, VLOS/BVLOS...) y los obstáculos y orografía." },
      { key: "volumen_contingencia", codigo: "0.6.1.3", label: "Se define el volumen de contingencia." },
      { key: "margen_riesgo_tierra", codigo: "0.6.1.4", label: "Se define el margen por riesgo en tierra." },
      { key: "zona_terrestre_controlada", codigo: "0.6.1.5", label: "Se define la zona terrestre controlada y contempla el control de accesos y ubicación de personal de asistencia." },
      { key: "ubicacion_observadores", codigo: "0.6.1.6", label: "Se planifica la ubicación de observadores y/o asistentes." },
      { key: "area_adyacente", codigo: "0.6.1.7", label: "Se calcula el área adyacente y se evalúa el riesgo en tierra y en aire." },
    ],
  },
  {
    key: "sobrevuelo_infra",
    codigo: "0.6.2",
    label: "Sobrevuelo de infraestructuras",
    items: [
      { key: "infra_criticas", codigo: "0.6.2.1", label: "Infraestructuras críticas: dispone de permiso previo y expreso del responsable de la infraestructura." },
      { key: "infra_defensa", codigo: "0.6.2.2", label: "Infraestructuras afectas a la Defensa Nacional y seguridad del Estado: se dispone de permiso previo y expreso del responsable de la infraestructura." },
      { key: "infra_industria", codigo: "0.6.2.3", label: "Instalaciones e infraestructuras de la industria química, transporte, energía, agua y tecnologías de la información y comunicaciones: se dispone de permiso previo y expreso del responsable de la infraestructura." },
    ],
  },
  {
    key: "aglomeraciones",
    codigo: "0.6.3",
    label: "Operaciones en zonas de aglomeraciones de edificios",
    items: [
      { key: "habilitacion_aglomeraciones", codigo: "0.6.3.1", label: "Se cuenta con la habilitación necesaria (el alcance de la autorización permite este tipo de operaciones)." },
      { key: "comunicacion_ministerio", codigo: "0.6.3.2", label: "Se realiza comunicación previa al Ministerio del Interior con plazo mínimo de diez días de antelación. También a organismos autonómicos cuando aplique." },
    ],
  },
  {
    key: "otras_limitaciones",
    codigo: "0.6.4",
    label: "Otras limitaciones",
    items: [
      { key: "otras_limitaciones_detalle", codigo: "0.6.4.1", label: "", freeText: true },
    ],
  },
];

// Construye el objeto inicial de respuestas para un grupo de checklist (valor de grupo
// "na" por defecto + cada item también "na", más el texto libre si aplica).
export function initRespuestas(checklist) {
  const out = {};
  for (const grupo of checklist) {
    out[grupo.key] = { valor: "na", items: {} };
    for (const item of grupo.items) {
      if (item.auto) continue; // no se guarda, se calcula al vuelo
      out[grupo.key].items[item.key] = "na";
      if (item.freeText) out[grupo.key].items[`${item.key}_texto`] = "";
    }
  }
  return out;
}
