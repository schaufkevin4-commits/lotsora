"use client";

import { useState } from "react";

export function PassBild({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  if (failed) return (
    <div className="mb-6 rounded-xl border p-4 text-sm" role="status">
      <p>Das Produktbild ist derzeit nicht verfügbar.</p>
      <button className="mt-2 underline underline-offset-4" onClick={() => {
        setAttempt((value) => value + 1); setFailed(false);
      }}>Bild erneut laden</button>
    </div>
  );
  // Öffentliche App-URL erneut anfragen; interne Vorschau behält ihre Signatur.
  const url = attempt && src.startsWith("/p/") ? `${src}${src.includes("?") ? "&" : "?"}versuch=${attempt}` : src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img key={attempt} src={url} alt={alt} onError={() => setFailed(true)} className="mb-6 aspect-square w-full rounded-xl object-cover" />;
}
