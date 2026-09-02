import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrAktionen } from "./QrAktionen";

type QrCodeAbschnittProps = {
  svg: string | null;
  passUrl: string | null;
};

export function QrCodeAbschnitt({ svg, passUrl }: QrCodeAbschnittProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>QR-Code</CardTitle>
        <CardDescription>
          Führt zur öffentlichen Produktpass-Seite — zum Teilen, Drucken oder
          Aufbringen auf das Produkt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {svg !== null && passUrl !== null ? (
          <>
            {/* Weißer Kasten: QR braucht hellen Hintergrund, auch im Dark Mode. */}
            <div className="inline-block rounded-md bg-white p-3">
              <div
                className="h-40 w-40 [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
            <a
              href={passUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {passUrl}
            </a>
            <QrAktionen svg={svg} passUrl={passUrl} />
          </>
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            QR-Code wird erzeugt, sobald der Pass veröffentlicht ist.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
