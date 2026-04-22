import Link from "next/link";
import { Hero } from "@/components/hero";
import { Recorder } from "@/components/recorder";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between py-4">
        <div>
          <p className="text-xl font-semibold">MelodyMatch</p>
          <p className="text-sm text-zinc-500">Buscador de canciones por tarareo</p>
        </div>
        <Link
          href="/api/history"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
        >
          Ver historial JSON
        </Link>
      </div>

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
