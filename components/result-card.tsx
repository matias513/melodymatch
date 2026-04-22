import type { SearchMatch } from "@/lib/types";

export function ResultCard({ item, index }: { item: SearchMatch; index: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-500/20 px-2 py-1 text-xs font-medium text-brand-100">
              #{index + 1}
            </span>
            <h3 className="text-lg font-semibold">{item.title}</h3>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {item.artist} · {item.region} · {item.country}
          </p>
          <p className="mt-2 text-sm text-zinc-300">{item.summary}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{item.confidence}%</p>
          <p className="text-xs text-zinc-500">coincidencia</p>
        </div>
      </div>
    </div>
  );
}
