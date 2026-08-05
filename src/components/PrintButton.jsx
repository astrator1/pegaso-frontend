import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Imprime el contenido de #print-area en una ventana nueva, en vez de imprimir la pestaña
// actual. Copiamos las hojas de estilo de la app (para que Tailwind y el CSS de impresión
// se apliquen igual) y el propio contenido ya renderizado.
function printInNewWindow() {
  const source = document.getElementById("print-area");
  if (!source) {
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join("\n");

  const win = window.open("", "_blank", "width=1000,height=1200");
  if (!win) {
    // El navegador bloqueó la ventana emergente: recurrimos a imprimir la pestaña actual.
    window.print();
    return;
  }

  win.document.open();
  win.document.write(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Imprimir</title>
    ${styles}
  </head>
  <body>
    <div id="print-area" class="${source.className}">${source.innerHTML}</div>
  </body>
</html>`);
  win.document.close();

  const doPrint = () => {
    win.focus();
    win.print();
  };
  win.onload = doPrint;
  // Algunos navegadores no disparan onload de forma fiable tras document.write; nos aseguramos.
  setTimeout(doPrint, 400);
}

export default function PrintButton() {
  return (
    <Button variant="outline" size="sm" className="no-print" onClick={printInNewWindow}>
      <Printer className="w-4 h-4 mr-1" /> Imprimir
    </Button>
  );
}
