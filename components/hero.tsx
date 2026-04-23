export default function Hero() {
  return (
    <section className="page-shell pt-8 pb-8 sm:pt-12 sm:pb-12">
      <div className="glass-card-strong grid-fade relative overflow-hidden px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
        <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 max-w-4xl">
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
            <button className="primary-button">Probar MelodyMatch</button>
            <button className="secondary-button">Ver cómo funciona</button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="glass-card px-5 py-5">
              <p className="text-sm text-slate-400">Catálogo inicial</p>
              <p className="mt-2 text-3xl font-bold text-white">60+ hits</p>
            </div>

            <div className="glass-card px-5 py-5">
              <p className="text-sm text-slate-400">Cobertura</p>
              <p className="mt-2 text-3xl font-bold text-white">Global + LATAM</p>
            </div>

            <div className="glass-card px-5 py-5">
              <p className="text-sm text-slate-400">Experiencia</p>
              <p className="mt-2 text-3xl font-bold text-white">Más premium</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
