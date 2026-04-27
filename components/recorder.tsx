"use client";

import { useRef, useState } from "react";
import { ResultCard } from "@/components/result-card";
import type { AudioFeatures, SearchMatch } from "@/lib/types";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function Recorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const energySamplesRef = useRef<number[]>([]);
  const zcrSamplesRef = useRef<number[]>([]);
  const beatSamplesRef = useRef<number[]>([]);
  const lastBeatRef = useRef<number>(0);

  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Tarareá la melodía o marcá el ritmo con la voz.");
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [features, setFeatures] = useState<AudioFeatures | null>(null);

  const analyze = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    const centered = Array.from(data, (v) => (v - 128) / 128);

    const energy = Math.sqrt(centered.reduce((sum, x) => sum + x * x, 0) / centered.length);
    let crossings = 0;
    for (let i = 1; i < centered.length; i++) {
      if ((centered[i - 1] < 0 && centered[i] >= 0) || (centered[i - 1] >= 0 && centered[i] < 0)) {
        crossings += 1;
      }
    }

    const zcr = crossings / centered.length;
    energySamplesRef.current.push(energy);
    zcrSamplesRef.current.push(zcr);

    const now = performance.now();
    if (energy > 0.09 && now - lastBeatRef.current > 240) {
      beatSamplesRef.current.push(now);
      lastBeatRef.current = now;
    }

    rafRef.current = requestAnimationFrame(analyze);
  };

  async function startRecording() {
    try {
      setResults([]);
      setFeatures(null);
      energySamplesRef.current = [];
      zcrSamplesRef.current = [];
      beatSamplesRef.current = [];
      lastBeatRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = context;
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const length = clamp((performance.now() - startedAtRef.current) / 5000, 0.15, 1);
        const density = clamp(beatSamplesRef.current.length / 18, 0.1, 1);
        const payload: AudioFeatures = {
          zcr: clamp(average(zcrSamplesRef.current) * 3.4, 0.05, 0.3),
          energy: clamp(average(energySamplesRef.current) * 2.6, 0.2, 0.9),
          density,
          length
        };

        setFeatures(payload);
        setStatus("Buscando coincidencias...");

        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        setResults(data.results ?? []);
        setStatus("Listo. Estas son las coincidencias más probables del catálogo inicial.");
      };

      mediaRecorderRef.current = recorder;
      startedAtRef.current = performance.now();
      recorder.start();
      setRecording(true);
      setStatus("Grabando... tarareá durante 4 a 8 segundos.");
      analyze();
    } catch {
      setStatus("No pude acceder al micrófono. Revisá los permisos del navegador.");
    }
  }

  async function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    await audioContextRef.current?.close();
    setRecording(false);
  }

return (
<section className="grid gap-6">
    <div className="glass-card-strong relative overflow-hidden p-6">
      <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-400">Grabador</p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Probá el buscador por tarareo
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
              Grabá una idea melódica o marcá el ritmo con tu voz. MelodyMatch
              transforma esa referencia en una búsqueda simple y te devuelve
              coincidencias probables.
            </p>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 sm:inline-flex">
            Demo experimental
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Entrada
            </p>
            <p className="mt-2 text-sm font-medium text-white">Tarareo o ritmo</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Motor
            </p>
            <p className="mt-2 text-sm font-medium text-white">Análisis rápido</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Salida
            </p>
            <p className="mt-2 text-sm font-medium text-white">Top coincidencias</p>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                {recording ? "Grabando ahora" : "Listo para grabar"}
              </p>
              <p className="mt-1 text-sm text-slate-400">{status}</p>
            </div>

            {!recording ? (
              <button
                onClick={startRecording}
                className="primary-button"
              >
                Empezar grabación
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
              >
                Detener grabación
              </button>
            )}
          </div>

          <div className="mt-6 flex items-end gap-2">
            {[28, 44, 24, 52, 36, 58, 30, 50, 34, 46, 26, 40].map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-full ${
                  recording ? "bg-violet-400/80" : "bg-white/10"
                } transition-all duration-300`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>

        {features && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Ritmo
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {features.density.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Energía
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {features.energy.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Cruces por cero
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {features.zcr.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Duración
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {features.length.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="glass-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">Resultados</p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Top 5 coincidencias
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Las coincidencias aparecen ordenadas para que el usuario entienda
            rápido qué canción tiene más chances de ser la correcta.
          </p>
        </div>

        <div className="hidden rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-300 sm:inline-flex">
          Ranking visual
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400">
            Grabá una melodía para ver resultados del catálogo curado.
          </div>
        ) : (
          results.map((item, index) => (
            <ResultCard
              key={`${item.title}-${index}`}
              item={item}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  </section>
);
}
