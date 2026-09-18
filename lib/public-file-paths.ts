export function oeffentlicherBildpfad(publicId: string, stand?: string) {
  // Neuer Bildbezug auch bei Clientnavigation erneut laden. Kein Freigabetoken:
  // der Abruf prüft unabhängig von diesem Anzeigeparameter den aktuellen Stand.
  return `/p/${encodeURIComponent(publicId)}/bild${stand ? `?stand=${encodeURIComponent(stand)}` : ""}`;
}

export function oeffentlicherDokumentpfad(publicId: string, documentId: string) {
  return `/p/${encodeURIComponent(publicId)}/dokumente/${encodeURIComponent(documentId)}`;
}
