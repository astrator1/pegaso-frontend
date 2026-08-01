import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintButton() {
  return (
    <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
      <Printer className="w-4 h-4 mr-1" /> Imprimir
    </Button>
  );
}