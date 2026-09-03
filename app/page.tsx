import { OeffentlicherSeitenrahmen } from "@/components/oeffentlich/seitenrahmen";

export default function Startseite() {
  return (
    <OeffentlicherSeitenrahmen>
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-6 py-20 sm:py-28">
        <section className="max-w-2xl space-y-6" aria-labelledby="seitentitel">
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Website im Aufbau
          </p>
          <h1
            id="seitentitel"
            className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
          >
            Diese Website befindet sich im Aufbau.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Der öffentliche Internetauftritt von lotsora wird derzeit vorbereitet.
          </p>
        </section>
      </main>
    </OeffentlicherSeitenrahmen>
  );
}
