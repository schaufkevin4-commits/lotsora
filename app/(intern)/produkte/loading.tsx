// Wird automatisch angezeigt, solange die Produktseite lädt (PP-020 E5: „lädt").
export default function Laedt() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="h-9 w-36 animate-pulse rounded bg-muted" />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <div className="h-9 bg-muted/50" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t px-4 py-3">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
              <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }