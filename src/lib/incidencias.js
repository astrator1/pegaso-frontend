// Calcula los avisos de "mantenimiento vencido" de aeronaves y baterías.
// Una incidencia se identifica por una "clave" estable (tipo + referencia + fecha del
// mantenimiento vencido). Si la fecha de próximo mantenimiento cambia (porque se hizo el
// mantenimiento y se actualizó), la clave cambia también, así que una incidencia resuelta
// deja de contar sola, sin depender de que alguien la descarte a mano.

export function computeIncidencias(aeronaves, baterias, mantenimientos) {
  const hoy = new Date().toISOString().slice(0, 10);
  const incidencias = [];

  aeronaves
    .filter((a) => !a.retirada && a.proximo_mantenimiento && a.proximo_mantenimiento < hoy)
    .forEach((a) => {
      incidencias.push({
        clave: `aeronave-${a.matricula}-${a.proximo_mantenimiento}`,
        tipo: "Aeronave",
        referencia: a.matricula,
        fecha_mantenimiento: a.proximo_mantenimiento,
        mensaje: `${a.matricula} (${a.marca} ${a.modelo}) — mantenimiento vencido desde ${a.proximo_mantenimiento}`,
      });
    });

  // Para baterías, la "próxima fecha" está en su último registro de mantenimiento, no en la
  // propia ficha de la batería.
  const ultimaProximaPorBateria = {};
  mantenimientos.forEach((m) => {
    if (!m.bateria_numero || !m.proxima_fecha) return;
    const actual = ultimaProximaPorBateria[m.bateria_numero];
    if (!actual || (m.fecha || "") > (actual.fecha || "")) {
      ultimaProximaPorBateria[m.bateria_numero] = { fecha: m.fecha, proxima_fecha: m.proxima_fecha };
    }
  });

  baterias
    .filter((b) => b.estado !== "Desechada")
    .forEach((b) => {
      const info = ultimaProximaPorBateria[b.numero_asignado];
      if (info && info.proxima_fecha < hoy) {
        incidencias.push({
          clave: `bateria-${b.numero_asignado}-${info.proxima_fecha}`,
          tipo: "Batería",
          referencia: b.numero_asignado,
          fecha_mantenimiento: info.proxima_fecha,
          mensaje: `Batería ${b.numero_asignado} (${b.marca} ${b.modelo}) — mantenimiento vencido desde ${info.proxima_fecha}`,
        });
      }
    });

  return incidencias;
}
