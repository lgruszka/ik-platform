"use client";

import { useMemo, useState } from "react";
import { Math as M, MathBlock } from "@/components/ui/math";

/**
 * Sanity check: jak przełożenie przekładni wpływa na bezwładność zredukowaną
 * widzianą z perspektywy silnika i na osiągalne pasmo regulatora prądowo-
 * pozycyjnego.
 *
 * Reguła kciuka: dla optymalnego sprzężenia silnik↔obciążenie wybiera się n
 * takie, że J_rotor ≈ J_load/n² (impedance matching). Przy zbyt małym n silnik
 * jest "przeciążany" inercją obciążenia (J_red duży → pasmo małe). Przy zbyt
 * dużym n silnik kręci się szybko ale przy małej prędkości na wyjściu — i J_red
 * jest zdominowane przez J_rotor (też niskie pasmo, bo bezwładność = J_rotor).
 *
 * Tu pokazujemy live wzór i suwaki: J_rotor, J_load (z dynamiki, "co widzi
 * silnik na wyjściu przekładni"), n. Wykres: pasmo ω_bw vs n.
 */

const K_P_DEFAULT = 1000; // współczynnik proporcjonalny regulatora prądowo-pozycyjnego (Nm/rad)

export function InertiaBandwidthCheck() {
  const [jRotor, setJRotor] = useState(1.3e-5); // kg·m² — Maxon EC-i 52 default
  const [jLoad, setJLoad] = useState(0.8); // kg·m² — typowa bezwładność „widziana" w łokciu ES5
  const [n, setN] = useState(100); // przełożenie
  const [Kp, setKp] = useState(K_P_DEFAULT);

  // Bezwładność zredukowana — co widzi silnik na swoim wale
  const jReflected = jLoad / (n * n);
  const jTotal = jRotor + jReflected;
  // Idealne n dla impedance matching: J_rotor = J_load/n²  →  n = √(J_load/J_rotor)
  const nOptimal = Math.sqrt(jLoad / jRotor);
  // Pasmo regulatora (uproszczone: ω_bw² = K_p/J_total)
  const omegaBw = Math.sqrt(Kp / jTotal); // rad/s
  const fBw = omegaBw / (2 * Math.PI); // Hz

  // Generuj krzywą pasma vs n dla wykresu
  const curve = useMemo(() => {
    const points: { n: number; fBw: number }[] = [];
    for (let logN = 0; logN <= 3; logN += 0.05) {
      const ni = Math.pow(10, logN); // od 1 do 1000
      const jt = jRotor + jLoad / (ni * ni);
      points.push({ n: ni, fBw: Math.sqrt(Kp / jt) / (2 * Math.PI) });
    }
    return points;
  }, [jRotor, jLoad, Kp]);

  const fBwMaxRaw = Math.max(...curve.map((p) => p.fBw));
  // Zaokrąglony górny zakres osi Y do "ładnej" wartości (1.05× max, do najbliższej
  // dziesiątki/setki w zależności od rzędu wielkości), żeby ticki były czytelne.
  const yAxisMax = (() => {
    const target = fBwMaxRaw * 1.05;
    const order = Math.pow(10, Math.floor(Math.log10(target)));
    const step = order >= 100 ? 50 : order >= 10 ? 10 : 1;
    return Math.ceil(target / step) * step;
  })();
  // Pięć znaczników rozłożonych równomiernie od 0 do yAxisMax.
  const yTicks = Array.from({ length: 5 }, (_, i) => (yAxisMax * i) / 4);

  // Wykres
  const W = 540, H = 240;
  // pad.l = 60 żeby zmieściły się trzyznakowe etykiety Hz (np. "120").
  const pad = { l: 60, r: 24, t: 18, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const r = (val: number) => Math.round(val * 100) / 100;
  // Skala logarytmiczna dla n
  const sx = (n: number) => pad.l + (Math.log10(n) / 3) * plotW;
  const sy = (f: number) => pad.t + (1 - f / yAxisMax) * plotH;

  const path = curve.map((p, i) => `${i === 0 ? "M" : "L"} ${r(sx(p.n))} ${r(sy(p.fBw))}`).join(" ");

  // Werdykty
  const ratio = jReflected / jRotor;
  const matchVerdict =
    ratio > 10 ? { color: "#dc2626", text: "Obciążenie dominuje — silnik za słaby albo n za małe" }
    : ratio < 0.1 ? { color: "#f59e0b", text: "Silnik dominuje — n za duże, marnujemy potencjał" }
    : { color: "#10b981", text: "Dobre dopasowanie impedancji (J_rotor ≈ J_load/n²)" };

  return (
    <div className="space-y-3 not-prose">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <p className="font-semibold text-sm mb-3">Parametry układu silnik+obciążenie</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)]">
              J_rotor (bezwładność wirnika): {(jRotor * 1e6).toFixed(1)} g·cm²
            </span>
            <input
              type="range" min={1e-6} max={1e-4} step={1e-7}
              value={jRotor} onChange={(e) => setJRotor(parseFloat(e.target.value))}
              className="accent-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)]">
              J_load (bezwładność obciążenia na wyjściu): {jLoad.toFixed(2)} kg·m²
            </span>
            <input
              type="range" min={0.01} max={5} step={0.01}
              value={jLoad} onChange={(e) => setJLoad(parseFloat(e.target.value))}
              className="accent-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)]">Przełożenie n: {n.toFixed(0)}:1</span>
            <input
              type="range" min={1} max={500} step={1}
              value={n} onChange={(e) => setN(parseFloat(e.target.value))}
              className="accent-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)]">K_p regulatora: {Kp} Nm/rad</span>
            <input
              type="range" min={50} max={5000} step={50}
              value={Kp} onChange={(e) => setKp(parseFloat(e.target.value))}
              className="accent-[var(--accent)]"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] p-3 text-xs font-mono space-y-2">
          <div>
            <p className="text-[var(--muted)] text-[10px]">Bezwładność zredukowana na wał silnika</p>
            <MathBlock tex="J_{\text{red}} = J_{\text{rotor}} + \frac{J_{\text{load}}}{n^2}" />
            <p className="tabular-nums">
              = {(jRotor * 1e6).toFixed(1)} + {(jReflected * 1e6).toFixed(1)} = <span className="font-semibold">{(jTotal * 1e6).toFixed(1)} g·cm²</span>
            </p>
          </div>
          <div>
            <p className="text-[var(--muted)] text-[10px]">Pasmo regulatora pozycyjnego (uproszczone)</p>
            <MathBlock tex="\omega_{bw} = \sqrt{K_p / J_{\text{red}}}" />
            <p className="tabular-nums">
              = {omegaBw.toFixed(0)} rad/s = <span className="font-semibold">{fBw.toFixed(1)} Hz</span>
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--code-bg)] p-3 text-xs space-y-2">
          <div>
            <p className="text-[var(--muted)] text-[10px] uppercase tracking-wider">Optymalne dopasowanie impedancji</p>
            <p className="font-mono">
              n_opt = <M tex="\sqrt{J_{\text{load}}/J_{\text{rotor}}}" /> = <span className="font-semibold tabular-nums">{nOptimal.toFixed(0)}:1</span>
            </p>
            <p className="text-[var(--muted)] text-[10px] mt-1">
              ratio J_load_red/J_rotor = <span className="font-mono tabular-nums">{ratio.toFixed(2)}</span>
            </p>
          </div>
          <div
            className="rounded px-2 py-1.5 text-[11px] font-semibold"
            style={{ backgroundColor: matchVerdict.color + "20", color: matchVerdict.color }}
          >
            {matchVerdict.text}
          </div>
        </div>
      </div>

      {/* Wykres pasmo vs n */}
      <div className="rounded-lg border border-[var(--panel-border)] bg-white overflow-hidden">
        <p className="text-xs font-semibold px-3 py-2 border-b border-[var(--panel-border)]">
          Pasmo regulatora f_bw [Hz] vs przełożenie n (skala log)
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="#fafbfc" stroke="#e5e7eb" />

          {/* Siatka pozioma — pomocnicze linie odpowiadające ticks osi Y */}
          {yTicks.slice(1, -1).map((f) => (
            <line
              key={`gy-${f}`}
              x1={pad.l}
              y1={r(sy(f))}
              x2={pad.l + plotW}
              y2={r(sy(f))}
              stroke="#e5e7eb"
              strokeWidth={0.6}
              strokeDasharray="3 3"
            />
          ))}

          {/* Pionowa siatka na rzędach wielkości n=10, 100 */}
          {[10, 100].map((tick) => (
            <line
              key={`gx-${tick}`}
              x1={r(sx(tick))}
              y1={pad.t}
              x2={r(sx(tick))}
              y2={pad.t + plotH}
              stroke="#e5e7eb"
              strokeWidth={0.6}
              strokeDasharray="3 3"
            />
          ))}

          {/* Krzywa pasma */}
          <path d={path} fill="none" stroke="#0ea5e9" strokeWidth={2} />

          {/* Pionowa linia "aktualne n" */}
          <line x1={r(sx(n))} y1={pad.t} x2={r(sx(n))} y2={pad.t + plotH}
                stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={r(sx(n))} y={pad.t + 10} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#dc2626" fontWeight={600}>
            n={n} ({fBw.toFixed(0)} Hz)
          </text>

          {/* Pionowa linia "n_opt" */}
          <line x1={r(sx(nOptimal))} y1={pad.t} x2={r(sx(nOptimal))} y2={pad.t + plotH}
                stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={r(sx(nOptimal))} y={pad.t + plotH - 4} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#10b981" fontWeight={600}>
            n_opt={nOptimal.toFixed(0)}
          </text>

          {/* Etykiety osi X (przełożenie n, skala log) */}
          {[1, 10, 100, 1000].map((tick) => (
            <g key={tick}>
              <line x1={r(sx(tick))} y1={pad.t + plotH} x2={r(sx(tick))} y2={pad.t + plotH + 4} stroke="#94a3b8" />
              <text x={r(sx(tick))} y={pad.t + plotH + 16} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#64748b">
                {tick}
              </text>
            </g>
          ))}

          {/* Etykiety osi Y (f_bw w Hz) */}
          {yTicks.map((f) => (
            <g key={`ly-${f}`}>
              <line x1={pad.l - 4} y1={r(sy(f))} x2={pad.l} y2={r(sy(f))} stroke="#94a3b8" />
              <text
                x={pad.l - 6}
                y={r(sy(f)) + 3}
                textAnchor="end"
                fontSize={9}
                fontFamily="monospace"
                fill="#64748b"
              >
                {f.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Tytuły osi */}
          <text x={pad.l + plotW / 2} y={H - 8} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#475569">
            przełożenie n
          </text>
          <text transform={`rotate(-90 14 ${pad.t + plotH / 2})`}
                x={14} y={pad.t + plotH / 2} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#475569">
            f_bw [Hz]
          </text>
        </svg>
      </div>

      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-xs space-y-2">
        <p className="font-semibold text-sm">Jak interpretować pasmo f_bw?</p>
        <p className="text-[var(--muted)]">
          <strong>Pasmo regulatora</strong> to <em>częstotliwość zaburzeń</em>, na które
          regulator pozycyjny jeszcze potrafi reagować. Konkretnie: dla zaburzeń
          (np. nagłej zmiany referencji, nagłej siły zewnętrznej) o częstotliwości &lt; f_bw
          regulator je <em>kompensuje</em> — błąd śledzenia tłumi się o &gt; 50%. Dla
          zaburzeń &gt; f_bw regulator „nie nadąża" — błąd zostaje.
        </p>
        <p className="text-[var(--muted)]">
          W praktyce inżynierskiej projektant celuje w <strong>f_bw ≥ 20–50 Hz</strong> dla
          regulatorów pozycyjnych manipulatorów przemysłowych. Niżej (~5–10 Hz) — robot wyglą­da
          „miękko", widać wibracje w cyklach pick-and-place i błąd śledzenia trajektorii. Wyżej
          (~100+ Hz) — robot „twardszy", ale wymaga lepszej sensoryki (enkoder z większą
          rozdzielczością, próbkowanie kontrolera ≥ 1 kHz) i ryzykuje pobudzenie modów
          rezonansowych konstrukcji mechanicznej (przekładnia harmoniczna ma typowo
          rezonans 80–200 Hz — pasmo regulatora musi być wyraźnie poniżej, inaczej
          niestabilność).
        </p>
        <p className="font-semibold pt-1">Reguła n_opt — impedance matching</p>
        <p className="text-[var(--muted)]">
          Krzywa pokazuje maksimum przy <em>n_opt</em> ≈ √(J_load/J_rotor). Za małe n —
          bezwładność obciążenia dominuje (J_red ≈ J_load/n² → duży); pasmo niskie. Za duże n —
          bezwładność wirnika dominuje (J_red ≈ J_rotor); pasmo wraca do plateau, ale
          wymagana prędkość silnika rośnie liniowo z n (energia kinetyczna kwadratowo).
          Przekładnie harmoniczne typowo 50–160 — w okolicy n_opt dla typowych cobotów.
        </p>
      </div>

      <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-xs space-y-2">
        <p className="font-semibold">
          A masa samego silnika? <span className="text-[var(--muted)] font-normal">(domknięcie pętli projektowej)</span>
        </p>
        <p className="text-[var(--muted)]">
          Dobry punkt — silnik DC + przekładnia harmoniczna typowo waży <strong>0.3–2.5 kg</strong>{" "}
          (np. Maxon EC-i 52: 0.65 kg, Harmonic Drive CSF-25: 0.8 kg). Montuje się go na
          poprzednim ogniwie (silnik napędzający przegub <em>i</em> siedzi na ogniwie{" "}
          <em>i-1</em>, blisko osi przegubu i). To <strong>nieignorowalna</strong> dodatkowa masa
          — dla przedramienia ES5 (m₃ = 2.85 kg) dodanie 1 kg silnika to +35% inercji
          obciążenia widzianej z barku.
        </p>
        <p className="text-[var(--muted)]">
          <strong>Co z tym zrobić w projekcie?</strong> Iteracyjnie:
        </p>
        <ol className="text-[var(--muted)] list-decimal pl-5 space-y-0.5">
          <li>
            Iteracja 0 — dobierz silnik dla nominalnej masy ogniw (jak teraz w tym module).
          </li>
          <li>
            Iteracja 1 — dodaj masę wybranego silnika do ogniwa <em>i-1</em> (zwykle blisko
            jego końca, niedaleko przegubu i). Przelicz NE: τ ↑ o 10–30%. Sprawdź czy
            wybrany silnik wciąż mieści się w krzywej T-N.
          </li>
          <li>
            Iteracja 2 — jeśli przeskoczył poza obwiednię, wybierz większy silnik. Powtórz
            od kroku 1. Zwykle 2–3 iteracje wystarczają do zbieżności.
          </li>
        </ol>
        <p className="text-[var(--muted)]">
          W zaawansowanych systemach CAD (SolidWorks, Fusion 360) ten cykl jest częściowo
          zautomatyzowany — model 3D zawiera silniki jako bryły o znanej masie i I_C,
          parametry dynamiczne robota są przeliczane automatycznie po wymianie napędu.
          W tym module aplikacji nie domykamy tej pętli, ale dla skali zauważ: dodanie
          masy silnika typowo zwiększa wymagane τ o 15–25%, co przekłada się na potrzebę
          silnika ~1 klasa wyższy (kolejny rozmiar w katalogu).
        </p>
      </div>
    </div>
  );
}
