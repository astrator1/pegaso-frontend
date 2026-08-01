export default function PrintHeader({ title }) {
  return (
    <div className="hidden print:block mb-5 pb-3" style={{ borderBottom: "2px solid #1e293b" }}>
      <h1 style={{ fontSize: "18px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#1e293b", margin: 0 }}>{title}</h1>
      <p style={{ fontSize: "10px", color: "#64748b", margin: "4px 0 0 0" }}>
        Generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}