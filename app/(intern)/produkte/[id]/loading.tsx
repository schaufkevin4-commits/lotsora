// app/(intern)/produkte/[id]/loading.tsx
export default function Laedt() {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-between">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="space-y-4 rounded-lg border p-5">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }