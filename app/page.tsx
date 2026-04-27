import Link from "next/link";
import Hero from "@/components/hero";
import { Recorder } from "@/components/recorder";

const featureCards = [
  {
    eyebrow: "Cómo funciona",
    title: "Tarareás o marcás el ritmo",
    text: "La app toma una idea musical corta y la convierte en una firma simple para comparar coincidencias.",
  },
  {
    eyebrow: "Búsqueda inicial",
    title: "Resultados rápidos y entendibles",
    text: "En vez de una interfaz técnica, te mostramos coincidencias claras, con contexto y prioridad visual.",
  },
  {
    eyebrow: "Escalabilidad",
    title: "Base lista para crecer",
    text: "Más adelante podés sumar un catálogo real, embeddings, cuentas, límites de uso y un modelo mejor.",
  },
];

const trustPoints = [
  "Descubrimiento por tarareo",
  "Catálogo inicial global + LATAM",
  "Historial de consultas",
  "Base visual premium para producto real",
];

export default function HomePage() {
  return (
    <main className="min-h-screen pb-16">
      <header className="page-shell pt-6 pb-4">
        <div className="glass-card flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/30 to-cyan-500/20 shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
              <span className="text-lg font-bold text-white">M</span>
            </div>

            <div>
              <p className="text-xl font-semibold tracking-tight text-white">
                MelodyMatch
              </p>
              <p className="text-sm text-slate-400">
                Descubrí canciones por tarareo, ritmo y memoria musical.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:inline-flex">
              Beta privada · catálogo inicial
            </div>

            <Link href="/api/history" className="secondary-button">
              Ver historial JSON
            </Link>
          </div>
        </div>
      </header>

      <Hero />

      <section className="page-shell pb-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card-strong p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Experiencia principal
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Probá el motor de búsqueda musical
                </h2>
              </div>

              <div className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300 sm:inline-flex">
                Demo activa
              </div>
            </div>

            <Recorder />
          </div>

          <aside className="space-y-6">
            <div className="glass-card p-6">
              <p className="text-sm font-medium text-slate-400">
                Qué hace distinto a MelodyMatch
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Una búsqueda pensada para memoria musical
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                La idea no es solo mostrar coincidencias. La idea es que la
                experiencia se sienta simple, confiable y visualmente clara
                desde el primer uso.
              </p>

              <div className="mt-6 space-y-3">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-sm text-slate-200">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <p className="text-sm font-medium text-slate-400">
                Visión del producto
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                El objetivo: algo tan natural como Shazam, pero guiado por la
                voz y el ritmo.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Esta versión es una base. Lo importante ahora es que la
                experiencia se vea sólida, clara y lista para evolucionar a un
                producto real.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="page-shell py-8">
        <div className="mb-6">
          <div className="badge-soft">Cómo está pensada la app</div>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Una home más clara, ordenada y lista para crecer
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            En vez de apilar bloques sueltos, organizamos la página para que el
            usuario entienda rápido qué hace MelodyMatch, cómo probarla y por
            qué puede ser útil.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featureCards.map((item) => (
            <article key={item.title} className="glass-card p-6">
              <p className="text-sm font-medium text-violet-300">
                {item.eyebrow}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
