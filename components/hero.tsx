export function Hero() {
  return (
    <section className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-8 shadow-glow backdrop-blur md:p-12">
      <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-300">
        Opción C · catálogo curado global + regional
      </div>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
        Encontrá una canción aunque no te acuerdes la letra.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-zinc-400 md:text-lg">
        Grabá un tarareo o marcá el ritmo. MelodyMatch analiza tu audio y te devuelve coincidencias
        probables de canciones globales y regionales conocidas.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Catálogo inicial</p>
          <p className="mt-1 text-2xl font-semibold">60+ hits</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Cobertura</p>
          <p className="mt-1 text-2xl font-semibold">Global + LATAM</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Lanzamiento</p>
          <p className="mt-1 text-2xl font-semibold">Deploy rápido</p>
        </div>
      </div>
    </section>
  );
}
