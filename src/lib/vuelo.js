export function parseHHMM(str) {
  if (!str) return null;
  const parts = str.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  return parts[0] * 60 + (parts[1] || 0);
}

export function flightDuration(horaDespegue, horaAterrizaje) {
  const a = parseHHMM(horaDespegue);
  const b = parseHHMM(horaAterrizaje);
  if (a == null || b == null) return 0;
  let d = b - a;
  if (d < 0) d += 24 * 60;
  return d;
}

export function formatDuration(mins) {
  if (!mins) return "0 min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function totalHorasMatricula(vuelos, matricula) {
  return vuelos
    .filter((v) => v.matricula === matricula)
    .reduce((s, v) => s + flightDuration(v.hora_despegue, v.hora_aterrizaje), 0);
}

export function totalHorasMatriculaHastaFecha(vuelos, matricula, fechaHasta) {
  if (!fechaHasta) return 0;
  return vuelos
    .filter((v) => v.matricula === matricula && v.fecha && v.fecha <= fechaHasta)
    .reduce((s, v) => s + flightDuration(v.hora_despegue, v.hora_aterrizaje), 0);
}

export function totalHorasBateria(vuelos, bateria) {
  return vuelos
    .filter((v) => v.bateria === bateria)
    .reduce((s, v) => s + flightDuration(v.hora_despegue, v.hora_aterrizaje), 0);
}