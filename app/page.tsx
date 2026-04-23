import Link from "next/link";
import { Hero } from "@/components/hero";
import { Recorder } from "@/components/recorder";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 md:px-8">
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

      <div className="mx-auto max-w-6xl space-y-8">
        <Hero />
        <Recorder />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-zinc-900/70 p-5">
            <p className="text-sm text-zinc-400">Cómo está pensado</p>
            <p className="mt-2 text-lg font-semibold">Salir rápido y mejorar después</p>
            <p className="mt-2 text-sm text-zinc-400">
              Esta versión usa un catálogo curado de hits globales y regionales para lanzar cuanto antes.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-zinc-900/70 p-5">
            <p className="text-sm text-zinc-400">Qué le falta para escalar</p>
            <p className="mt-2 text-lg font-semibold">Motor y catálogo reales</p>
            <p className="mt-2 text-sm text-zinc-400">
              Después podés sumar embeddings, búsquedas vectoriales, licencias y millones de canciones.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-zinc-900/70 p-5">
            <p className="text-sm text-zinc-400">Monetización</p>
            <p className="mt-2 text-lg font-semibold">Freemium + premium</p>
            <p className="mt-2 text-sm text-zinc-400">
              La base ya queda lista para sumar límites por uso, cuentas y pagos más adelante.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
