"use client";

import { useEffect, useRef, useState } from "react";
import { ResultCard } from "@/components/result-card";
import type { AudioFeatures, SearchMatch } from "@/lib/types";

type FrameMetrics = {
  energy: number;
  zcr: number;
  voiced: boolean;
  peak: number;
  timestamp: number;
};

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function Recorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const stopTimeoutRef = useRef<number | null>(null);

  const frameMetricsRef = useRef<FrameMetrics[]>([]);
  const beatTimesRef = useRef<number[]>([]);
  const lastBeatAtRef = useRef<number>(0);

  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState(
    "Tarareá la melodía o marcá el ritmo con la voz."
  );
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [features, setFeatures] = useState<AudioFeatures | null>(null);
  const [bars, setBars] = useState<number[]>([20, 28, 18, 32, 24, 36, 20, 30, 22, 34, 18, 28]);

  function cleanupAudioGraph() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void audioContextRef.current?.close();
    audioContextRef.current = null;

    analyserRef.current = null;
  }

  useEffect(() => {
    return () => {
      cleanupAudioGraph();
    };
  }, []);

  const analyzeFrame = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const timeData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeData);

    let energy = 0;
    let zeroCrossings = 0;
    let peak = 0;

    for (let i = 0; i < timeData.length; i += 1) {
      const normalized = (timeData[i] - 128) / 128;
      const abs = Math.abs(normalized);

      energy += normalized * normalized;
      if (abs > peak) peak = abs;

      if (i > 0) {
        const prev = timeData[i - 1] - 128;
        const curr = timeData[i] - 128;
        if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
          zeroCrossings += 1;
        }
      }
    }

    energy /= timeData.length;
    const zcr = zeroCrossings / timeData.length;

    const voiced = energy > 0.0025 && peak > 0.08;

    const now = performance.now();

    frameMetricsRef.current.push({
      energy,
      zcr,
      voiced,
      peak,
      timestamp: now,
    });

    const recent = frameMetricsRef.current.slice(-12);
    const visualBars = recent.map((frame) => {
      const value = frame.voiced
        ? clamp(frame.energy * 850 + frame.peak * 42, 0.18, 1)
        : clamp(frame.energy * 300 + frame.peak * 16, 0.12, 0.55);

      return Math.round(18 + value * 46);
    });

    if (visualBars.length > 0) {
      setBars([
        ...Array(Math.max(0, 12 - visualBars.length)).fill(18),
        ...visualBars,
      ]);
    }

    const beatThreshold = 0.0105;
    const minBeatGap = 280;

    if (voiced && energy > beatThreshold && now - lastBeatAtRef.current > minBeatGap) {
      beatTimesRef.current.push(now);
      lastBeatAtRef.current = now;
    }

    rafRef.current = requestAnimationFrame(analyzeFrame);
  };

  function buildFeaturesFromFrames(durationSec: number): AudioFeatures | null {
  const frames = frameMetricsRef.current;
  if (!frames.length) return null;

  const voicedFrames = frames.filter((frame) => frame.voiced);
  if (voicedFrames.length < 10) {
    return null;
  }

  const energyValues = voicedFrames.map((frame) => frame.energy);
  const zcrValues = voicedFrames.map((frame) => frame.zcr);
  const peakValues = voicedFrames.map((frame) => frame.peak);

  const voicedRatio = voicedFrames.length / frames.length;
  const avgEnergy = average(energyValues);
  const medEnergy = median(energyValues);
  const avgPeak = average(peakValues);
  const medPeak = median(peakValues);
  const avgZcr = average(zcrValues);
  const medZcr = median(zcrValues);

  const beatTimes = beatTimesRef.current;
  const beatIntervals: number[] = [];

  for (let i = 1; i < beatTimes.length; i += 1) {
    beatIntervals.push(beatTimes[i] - beatTimes[i - 1]);
  }

  const medianBeatGap = median(beatIntervals);
  const beatDensity =
    durationSec > 0 ? clamp((beatTimes.length / durationSec) / 4, 0, 1) : 0;

  const rhythmStability =
    medianBeatGap > 0
      ? clamp(1 - Math.min(0.45, Math.abs(medianBeatGap - 520) / 900), 0, 1)
      : 0.35;

  const density = clamp(
    voicedRatio * 0.42 +
      avgPeak * 0.22 +
      medPeak * 0.18 +
      medEnergy * 10 +
      beatDensity * 0.12 +
      rhythmStability * 0.06
  );

  const energy = clamp(avgEnergy * 24 + medEnergy * 10 + avgPeak * 0.34);

  let stableZcr = clamp(avgZcr * 6.5 + medZcr * 2.5, 0, 1);
  if (stableZcr < 0.08) stableZcr *= 0.82;
  if (stableZcr > 0.78) stableZcr = 0.78;

  const normalizedLength = clamp(durationSec / 8, 0, 1);

  return {
    density,
    energy,
    zcr: stableZcr,
    length: normalizedLength,
  };
}
  }

  async function startRecording() {
    try {
      setResults([]);
      setFeatures(null);
      setAnalyzing(false);
      setStatus("Preparando grabación...");

      frameMetricsRef.current = [];
      beatTimesRef.current = [];
      lastBeatAtRef.current = 0;
      chunksRef.current = [];
      setBars([20, 28, 18, 32, 24, 36, 20, 30, 22, 34, 18, 28]);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;

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
          const durationMs = Math.max(1, performance.now() - startedAtRef.current);
          const durationSec = durationMs / 1000;

          if (durationSec < 2.8) {
            setStatus("La grabación fue muy corta. Probá tararear entre 4 y 8 segundos.");
            setAnalyzing(false);
            cleanupAudioGraph();
            return;
          }

          const payload = buildFeaturesFromFrames(durationSec);

          if (!payload) {
            setStatus("No detecté suficiente voz clara. Probá cantar o tararear un poco más fuerte.");
            setAnalyzing(false);
            cleanupAudioGraph();
            return;
          }

          setFeatures(payload);
          setStatus("Analizando audio y buscando coincidencias...");
          setAnalyzing(true);

          const response = await fetch("/api/search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          setResults(data.results ?? []);

          setStatus("Listo. Estas son las coincidencias más probables del catálogo inicial.");
          setAnalyzing(false);
          cleanupAudioGraph();
        } catch {
          setStatus("No pudimos analizar el audio. Probá grabar de nuevo.");
          setAnalyzing(false);
          cleanupAudioGraph();
        }
      };

      mediaRecorderRef.current = recorder;
      startedAtRef.current = performance.now();

      recorder.start();
      setRecording(true);
      setStatus("Grabando... tarareá durante 4 a 8 segundos.");
      analyzeFrame();

      stopTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          void stopRecording();
        }
      }, 8000);
    } catch {
      setStatus("No pude acceder al micrófono. Revisá los permisos del navegador.");
      setAnalyzing(false);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    setAnalyzing(true);
    setStatus("Analizando audio...");
    setRecording(false);

    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
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
                Análisis más estable
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Salida
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                Top 5 más coherente
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

                <p className="mt-1 text-sm text-slate-400">{status}</p>
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
              {bars.map((h, i) => (
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
