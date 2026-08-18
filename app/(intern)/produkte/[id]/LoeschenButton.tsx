// app/(intern)/produkte/[id]/LoeschenButton.tsx
"use client";

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
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Abbrechen</Button>
          </DialogClose>
          <form action={produktLoeschen.bind(null, id)}>
            <Button type="submit" variant="destructive">Endgültig löschen</Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}