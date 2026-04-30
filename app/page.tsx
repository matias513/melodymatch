import Link from "next/link";
import { Recorder } from "@/components/recorder";

const quickSteps = [
  "Tarareás o marcás el ritmo",
  "Analizamos la referencia",
  "Te mostramos el top 5 más probable",
];

const quickFaq = [
  {
    q: "¿Hace falta cantar bien?",
    a: "No. Solo hace falta una referencia aproximada, clara y corta.",
  },
  {
    q: "¿Cuánto tengo que grabar?",
    a: "Entre 4 y 8 segundos suele funcionar mejor.",
  },
  {
    q: "¿Ya usa un catálogo masivo?",
    a: "Todavía no. Esta versión usa un catálogo curado para validar la experiencia.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen pb-20">
      <header className="page-shell pt-6 pb-6">
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/30 to-cyan-500/20">
              <span className="text-lg font-bold text-white">M</span>
            </div>

            <div>
              <p className="text-lg font-semibold text-white">MelodyMatch</p>
              <p className="text-sm text-slate-400">
                Encontrá canciones desde la memoria musical.
              </p>
            </div>
          </div>

          <Link href="/api/history" className="secondary-button">
            Historial
          </Link>
        </div>
      </header>

      <section className="page-shell pt-4 pb-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-300">
            Búsqueda por tarareo
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Tarareá una canción y encontrá coincidencias en segundos.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Menos texto, menos vueltas. Entrás, grabás una referencia corta y ves
            las canciones con más chances de ser la correcta.
          </p>

          <div className="mt-8 flex justify-center">
            <a href="#recorder" className="primary-button text-base">
              Grabar ahora
            </a>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Probá tararear entre 4 y 8 segundos en un lugar silencioso.
          </p>
        </div>
      </section>

      <section className="page-shell pb-8">
        <div className="mx-auto max-w-5xl">
          <Recorder />
        </div>
      </section>

      <section id="como-funciona" className="page-shell py-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card p-6 sm:p-8">
            <div className="badge-soft">Cómo funciona</div>

            <h2 className="mt-4 text-3xl font-bold text-white">
              Una experiencia simple y directa
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              La idea de MelodyMatch es que la acción principal esté clarísima:
              grabar una referencia musical y entender rápido cuáles son las
              coincidencias más probables.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {quickSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Paso {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              FAQ rápida
            </div>

            <div className="mt-5 space-y-4">
              {quickFaq.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-sm font-semibold text-white">{item.q}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
