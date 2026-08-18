import type { ProductStatus } from "@/lib/services/products";

const LABELS: Record<ProductStatus, { text: string; className: string }> = {
  entwurf: { text: "Entwurf", className: "bg-gray-100 text-gray-700" },
  unvollstaendig: { text: "Unvollständig", className: "bg-amber-100 text-amber-800" },
  veroeffentlicht: { text: "Veröffentlicht", className: "bg-green-100 text-green-800" },
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  const s = LABELS[status] ?? LABELS.entwurf;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.text}
    </span>
  );
}