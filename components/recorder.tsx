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
  const chunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const energySamplesRef = useRef<number[]>([]);
  const zcrSamplesRef = useRef<number[]>([]);
  const beatSamplesRef = useRef<number[]>([]);
  const lastBeatRef = useRef<number>(0);

  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState(
    "Tarareá la melodía o marcá el ritmo con la voz."
  );
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [features, setFeatures] = useState<AudioFeatures | null>(null);

  const analyze = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);

    let energy = 0;
    let zeroCrossings = 0;

    for (let i = 0; i < data.length; i += 1) {
      const normalized = (data[i] - 128) / 128;
      energy += normalized * normalized;

      if (i > 0) {
        const prev = data[i - 1] - 128;
        const curr = data[i] - 128;
        if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
          zeroCrossings += 1;
        }
      }
    }

    energy /= data.length;
    const zcr = zeroCrossings / data.length;

    energySamplesRef.current.push(energy);
    zcrSamplesRef.current.push(zcr);

    const now = performance.now();
    const threshold = 0.02;

    if (energy > threshold && now - lastBeatRef.current > 260) {
      beatSamplesRef.current.push(now);
      lastBeatRef.current = now;
    }

    rafRef.current = requestAnimationFrame(analyze);
  };

  async function startRecording() {
    try {
      setResults([]);
      setFeatures(null);
      setAnalyzing(false);
      setStatus("Preparando grabación...");

      energySamplesRef.current = [];
      zcrSamplesRef.current = [];
      beatSamplesRef.current = [];
      lastBeatRef.current = 0;
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const durationMs = Math.max(
            1,
            performance.now() - startedAtRef.current
          );
          const durationSec = durationMs / 1000;

          const density = clamp(average(energySamplesRef.current) * 40, 0, 1);
          const energy = clamp(average(energySamplesRef.current) * 55, 0, 1);
          const zcr = clamp(average(zcrSamplesRef.current) * 12, 0, 1);

          let bpm = 0;
          const beats = beatSamplesRef.current;

          if (beats.length >= 2) {
            const intervals: number[] = [];
            for (let i = 1; i < beats.length; i += 1) {
              intervals.push(beats[i] - beats[i - 1]);
            }

            const avgInterval = average(intervals);
            bpm = avgInterval > 0 ? 60000 / avgInterval : 0;
          }

          const normalizedBpm = clamp(bpm / 180, 0, 1);

          const payload: AudioFeatures = {
            density,
            energy,
            zcr,
            length: clamp(durationSec / 8, 0, 1),
          };

          setFeatures(payload);
          setStatus("Analizando audio y buscando coincidencias...");
          setAnalyzing(true);

          const response = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          setResults(data.results ?? []);
          setStatus(
            "Listo. Estas son las coincidencias más probables del catálogo inicial."
          );

          await new Promise((resolve) => setTimeout(resolve, 1200));
          setAnalyzing(false);
        } catch {
          setStatus("No pudimos analizar el audio. Probá grabar de nuevo.");
          setAnalyzing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      startedAtRef.current = performance.now();

      recorder.start();
      setRecording(true);
      setStatus("Grabando... tarareá durante 4 a 8 segundos.");
      analyze();
    } catch {
      setStatus("No pude acceder al micrófono. Revisá los permisos del navegador.");
      setAnalyzing(false);
    }
  }

  async function stopRecording() {
    setAnalyzing(true);
    setStatus("Analizando audio...");

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    await audioContextRef.current?.close();
    audioContextRef.current = null;

    setRecording(false);
  }

  return (
    <section id="recorder" className="grid gap-6">
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
              Prueba interactiva
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Entrada
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                Tarareo o ritmo
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Motor
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                Análisis rápido
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Salida
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                Mejores coincidencias
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  {recording
                    ? "Grabando ahora"
                    : analyzing
                      ? "Analizando audio"
                      : "Grabación disponible"}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {analyzing
                    ? "Estamos procesando la grabación para encontrar coincidencias."
                    : status}
                </p>
              </div>

              {recording ? (
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
                >
                  Detener grabación
                </button>
              ) : analyzing ? (
                <div className="inline-flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
                  Analizando audio...
                </div>
              ) : (
                <button onClick={startRecording} className="primary-button">
                  Empezar grabación
                </button>
              )}
            </div>

            <div className="mt-6 flex items-end gap-2">
              {[28, 44, 24, 52, 36, 58, 30, 50, 34, 46, 26, 40].map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-full transition-all duration-300 ${
                    recording
                      ? "bg-violet-400/80"
                      : analyzing
                        ? "bg-cyan-400/70"
                        : "bg-white/10"
                  }`}
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
              Mejores coincidencias
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Las coincidencias aparecen ordenadas para que el usuario entienda
              rápido qué canción tiene más chances de ser la correcta.
            </p>
          </div>

          <div className="hidden rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-300 sm:inline-flex">
            Resultados ordenados
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {results.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.04] px-5 py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
                ♪
              </div>

              <p className="mt-4 text-sm font-medium text-white">
                Todavía no hay resultados para mostrar
              </p>

              <p className="mt-2 text-sm leading-7 text-slate-400">
                Grabá una melodía para ver resultados del catálogo curado.
              </p>
            </div>
          ) : (
            <>
              {results.map((item, index) => (
                <ResultCard
                  key={`${item.title}-${index}`}
                  item={item}
                  index={index}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
