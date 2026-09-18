"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type QrAktionenProps = {
  svg: string;
  passUrl: string;
};

export function QrAktionen({ svg, passUrl }: QrAktionenProps) {
  const [kopiert, setKopiert] = useState(false);
  const [meldung, setMeldung] = useState("");

  // Pass-ID aus der URL → im Dateinamen für Rückverfolgbarkeit.
  const dateiname = `produktpass-${passUrl.split("/").pop() ?? "code"}`;

  async function linkKopieren() {
    try {
      await navigator.clipboard.writeText(passUrl);
      setKopiert(true);
      setMeldung("Link kopiert.");
      setTimeout(() => setKopiert(false), 2000);
    } catch {
      setMeldung("Kopieren nicht möglich. Bitte den angezeigten Link manuell kopieren.");
    }
  }

  // Download-Mechanik einmal an einer Stelle (DRY): unsichtbaren <a download> klicken.
  function datenLink(href: string, endung: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = `${dateiname}.${endung}`;
    a.click();
    setMeldung(`${endung.toUpperCase()}-Download gestartet.`);
  }

  function svgHerunterladen() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    datenLink(url, "svg");
    URL.revokeObjectURL(url);
  }

  function pngHerunterladen() {
    const groesse = 1024; // px – hoch genug für sauberen Druck
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = groesse;
      canvas.height = groesse;
      const ctx = canvas.getContext("2d");
      if (!ctx) { setMeldung("PNG konnte nicht erzeugt werden. Bitte SVG verwenden."); return; }
      ctx.fillStyle = "#ffffff"; // weißer Hintergrund für Kontrast
      ctx.fillRect(0, 0, groesse, groesse);
      ctx.drawImage(img, 0, 0, groesse, groesse); // Vektor → sauber gerastert
      canvas.toBlob((blob) => {
        if (!blob) { setMeldung("PNG konnte nicht erzeugt werden. Bitte SVG verwenden."); return; }
        const url = URL.createObjectURL(blob);
        datenLink(url, "png");
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.onerror = () => setMeldung("PNG konnte nicht erzeugt werden. Bitte SVG verwenden.");
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={linkKopieren}>
        {kopiert ? "Kopiert!" : "Link kopieren"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            QR-Code herunterladen
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-w-[calc(100vw-2rem)]">
          <DropdownMenuItem onClick={pngHerunterladen}>
            Als Bild (PNG) – für Word, E-Mail, Etiketten
          </DropdownMenuItem>
          <DropdownMenuItem onClick={svgHerunterladen}>
            Als Druckvorlage (SVG) – verlustfrei für Druckereien
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="w-full text-sm text-muted-foreground">{meldung}</p>
    </div>
  );
}
