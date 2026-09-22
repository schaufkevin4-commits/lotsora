"use client";
import { useActionState } from "react";
import { useFileUpload } from "./use-file-upload";
import { IMAGE_ACCEPT } from "@/lib/uploads/contract";
import { produktbildEntfernen } from "@/app/(intern)/produkte/upload-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProductImage({ productId, path, url }: { productId: string; path: string | null; url: string | null }) {
  const { state, action, pending, cancel, canCancel } = useFileUpload(productId, "image", path);
  const [removed, remove, removing] = useActionState(async () => produktbildEntfernen(productId, path!), { ok: false, error: null });
  return <section className="space-y-4 rounded-lg border p-5">
    <h2 className="font-medium">Produktbild</h2>
    <p className="text-sm text-muted-foreground">JPEG, PNG oder WebP, maximal 10 MiB und 25 Megapixel. Bildwechsel ändern zunächst den Entwurf. Das bisherige öffentliche Bild bleibt bis zur nächsten Veröffentlichung erhalten.</p>
    {url && <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Aktuelles Produktbild" className="h-48 w-48 rounded-lg object-contain" />
    </>}
    <form action={action} className="space-y-3">
      <Label htmlFor="produktbild-datei">{path ? "Neues Produktbild" : "Produktbild auswählen"}</Label>
      <Input id="produktbild-datei" name="datei" type="file" accept={IMAGE_ACCEPT} disabled={pending || removing} />
      <div className="flex gap-3">
        <Button type="submit" disabled={pending || removing}>{pending ? "Wird hochgeladen und geprüft …" : path ? "Bild ersetzen" : "Bild hochladen"}</Button>
        {canCancel && <Button type="button" variant="outline" onClick={cancel}>Upload abbrechen</Button>}
      </div>
    </form>
    {path && <form action={remove}><Button variant="outline" disabled={pending || removing}>{removing ? "Wird entfernt …" : "Bild entfernen"}</Button></form>}
    {(state.error || removed.error) && <p role="alert" className="text-sm text-destructive">{state.error || removed.error}</p>}
    {state.ok && <p role="status" className="text-sm">Produktbild gespeichert.</p>}
  </section>;
}
