import type { SearchMatch } from "@/lib/types";

export function ResultCard({
  item,
  index,
}: {
  item: SearchMatch;
  index: number;
}) {
  const isTop = index === 0;
  const confidenceTone =
    item.confidence >= 85
      ? "text-emerald-300 border-emerald-400/20 bg-emerald-400/10"
      : item.confidence >= 72
        ? "text-cyan-300 border-cyan-400/20 bg-cyan-400/10"
        : "text-amber-300 border-amber-400/20 bg-amber-400/10";

  return (
    <article className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
              #{index + 1}
            </span>

            {isTop && (
              <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-300">
                Mejor match
              </span>
            )}
          </div>

          <h3 className="truncate text-lg font-semibold text-white sm:text-xl">
            {item.title}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {item.artist} · {item.region} · {item.country}
          </p>
        </div>

        <div className="text-right">
          <div
            className={`inline-flex rounded-2xl border px-3 py-2 text-sm font-semibold ${confidenceTone}`}
          >
            {item.confidence}%
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
            coincidencia
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400"
            style={{ width: `${item.confidence}%` }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
          Lectura rápida
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-300">{item.summary}</p>
      </div>
    </article>
  );
}
