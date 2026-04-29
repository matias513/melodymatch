import type { SearchMatch } from "@/lib/types";

function getConfidenceTone(confidence: number) {
  if (confidence >= 85) {
    return {
      pill: "text-emerald-300 border-emerald-400/20 bg-emerald-400/10",
      bar: "from-emerald-400 via-cyan-400 to-violet-400",
      label: "Muy alta",
    };
  }

  if (confidence >= 72) {
    return {
      pill: "text-cyan-300 border-cyan-400/20 bg-cyan-400/10",
      bar: "from-cyan-400 via-violet-400 to-fuchsia-400",
      label: "Alta",
    };
  }

  return {
    pill: "text-amber-300 border-amber-400/20 bg-amber-400/10",
    bar: "from-amber-400 via-orange-400 to-pink-400",
    label: "Media",
  };
}

export function ResultCard({
  item,
  index,
}: {
  item: SearchMatch;
  index: number;
}) {
  const isTop = index === 0;
  const tone = getConfidenceTone(item.confidence);

  return (
    <article
      className={`group rounded-[28px] border bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06] ${
        isTop
          ? "border-violet-400/20 shadow-[0_0_0_1px_rgba(167,139,250,0.08)]"
          : "border-white/10"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

            <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-slate-400">
              {item.region}
            </span>
          </div>

          <h3 className="truncate text-lg font-semibold text-white sm:text-xl">
            {item.title}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {item.artist} · {item.country}
          </p>
        </div>

        <div className="sm:text-right">
          <div
            className={`inline-flex rounded-2xl border px-3 py-2 text-sm font-semibold ${tone.pill}`}
          >
            {item.confidence}%
          </div>

          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
            confianza {tone.label}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
            style={{ width: `${item.confidence}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Región
          </p>
          <p className="mt-2 text-sm font-medium text-white">{item.region}</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            País
          </p>
          <p className="mt-2 text-sm font-medium text-white">{item.country}</p>
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
