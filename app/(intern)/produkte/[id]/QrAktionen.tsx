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

  // Produkt-ID aus der URL → im Dateinamen für Rückverfolgbarkeit.
  const dateiname = `produktpass-${passUrl.split("/").pop() ?? "code"}`;

  async function linkKopieren() {
    await navigator.clipboard.writeText(passUrl);
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  }

  // Download-Mechanik einmal an einer Stelle (DRY): unsichtbaren <a download> klicken.
  function datenLink(href: string, endung: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = `${dateiname}.${endung}`;
    a.click();
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
      if (!ctx) return;
      ctx.fillStyle = "#ffffff"; // weißer Hintergrund für Kontrast
      ctx.fillRect(0, 0, groesse, groesse);
      ctx.drawImage(img, 0, 0, groesse, groesse); // Vektor → sauber gerastert
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        datenLink(url, "png");
        URL.revokeObjectURL(url);
      }, "image/png");
    };
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
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={pngHerunterladen}>
            Als Bild (PNG) – für Word, E-Mail, Etiketten
          </DropdownMenuItem>
          <DropdownMenuItem onClick={svgHerunterladen}>
            Als Druckvorlage (SVG) – verlustfrei für Druckereien
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
