export default function Hero() {
  return (
    <section className="page-shell pt-8 pb-8 sm:pt-12 sm:pb-12">
      <div className="glass-card-strong grid-fade relative overflow-hidden px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="max-w-4xl">
            <div className="badge-soft mb-5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Opción C · catálogo curado global + regional
            </div>

            <h1 className="section-title max-w-4xl">
              Encontrá una canción aunque no te acuerdes la letra.
            </h1>

            <p className="section-subtitle mt-6 max-w-2xl">
              Tarareá, marcá el ritmo o grabá una idea melódica. MelodyMatch
              analiza tu audio y te devuelve coincidencias probables de canciones
              globales y regionales conocidas.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#recorder" className="primary-button">Probar MelodyMatch</a>
              <a href="#como-funciona" className="secondary-button">Ver cómo funciona</a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="glass-card px-5 py-5">
                <p className="text-sm text-slate-400">Catálogo inicial</p>
                <p className="mt-2 text-3xl font-bold text-white">60+ hits</p>
              </div>

              <div className="glass-card px-5 py-5">
                <p className="text-sm text-slate-400">Cobertura</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  Global + LATAM
                </p>
              </div>

              <div className="glass-card px-5 py-5">
                <p className="text-sm text-slate-400">Experiencia</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  Más premium
                </p>
              </div>
            </div>
          </div>

          <div className="lg:pl-6">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Vista rápida
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Cómo se siente el producto
                  </p>
                </div>

                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Beta
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Entrada
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    Tarareo, ritmo o idea melódica
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Matching
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    Coincidencias ordenadas por confianza
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Objetivo
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    Una experiencia simple, clara y memorable
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-2">
                {[36, 54, 28, 66, 42, 76, 34, 62, 40, 70, 32, 56].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="w-full rounded-full bg-gradient-to-t from-violet-500/70 to-cyan-400/70"
                      style={{ height: `${h}px` }}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
