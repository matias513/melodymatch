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
    <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-6 shadow-glow">
        <p className="text-sm text-zinc-400">Grabador</p>
        <h2 className="mt-1 text-2xl font-semibold">Probá el buscador por tarareo</h2>
        <p className="mt-3 text-zinc-400">{status}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {!recording ? (
            <button
              onClick={startRecording}
              className="rounded-2xl bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600"
            >
              Empezar grabación
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="rounded-2xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-500"
            >
              Detener grabación
            </button>
          )}
        </div>

        {features && (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-zinc-400">Ritmo / densidad</p>
              <p className="mt-1 text-xl font-semibold">{features.density.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-zinc-400">Energía</p>
              <p className="mt-1 text-xl font-semibold">{features.energy.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-zinc-400">Cruces por cero</p>
              <p className="mt-1 text-xl font-semibold">{features.zcr.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-zinc-400">Duración normalizada</p>
              <p className="mt-1 text-xl font-semibold">{features.length.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-zinc-900/80 p-6 shadow-glow">
        <p className="text-sm text-zinc-400">Resultados</p>
        <h2 className="mt-1 text-2xl font-semibold">Top 5 coincidencias</h2>
        <div className="mt-5 space-y-3">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-zinc-400">
              Grabá una melodía para ver resultados del catálogo curado.
            </div>
          ) : (
            results.map((item, index) => <ResultCard key={`${item.title}-${index}`} item={item} index={index} />)
          )}
        </div>
      </div>
    </section>
  );
}
