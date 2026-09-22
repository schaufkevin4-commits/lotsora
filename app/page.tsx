import { Seitentitel } from "@/components/layout/seitentitel";
import { OeffentlicherSeitenrahmen } from "@/components/oeffentlich/seitenrahmen";

export default function Startseite() {
  return (
    <OeffentlicherSeitenrahmen>
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6 sm:py-16">
        <section className="max-w-2xl space-y-6">
          <Seitentitel titel="Diese Website befindet sich im Aufbau." kontext="Website im Aufbau" />
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Der öffentliche Internetauftritt von lotsora wird derzeit vorbereitet.
          </p>
        </section>
      </main>
    </OeffentlicherSeitenrahmen>
  );
}
