// app/(intern)/produkte/[id]/LoeschenButton.tsx
"use client";

import { useActionState } from "react";
import { produktLoeschen } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export function LoeschenButton({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(produktLoeschen.bind(null, id), { ok: false, error: null });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">Löschen</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Produkt löschen?</DialogTitle>
          <DialogDescription>
            {name.trim() ? `„${name}"` : "Dieses Produkt"} wird dauerhaft gelöscht.
            Das lässt sich nicht rückgängig machen.
          </DialogDescription>
        </DialogHeader>
        {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>Abbrechen</Button>
          </DialogClose>
          <form action={action}>
            <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Wird gelöscht …" : "Endgültig löschen"}</Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}