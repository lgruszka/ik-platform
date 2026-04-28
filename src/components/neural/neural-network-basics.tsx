/**
 * Bardzo prosty schemat sieci neuronowej (MLP) z trzema warstwami:
 * wejście (poza T) → ukryte 1 → ukryte 2 → wyjście (q1..q6). Pokazuje
 * neurony, połączenia i wagi. Cel: pokazać studentowi, że sieć neuronowa
 * to po prostu uczone parametrycznie odwzorowanie wektora wejściowego na
 * wektor wyjściowy — nic mistycznego.
 */
export function NeuralNetworkBasicsDiagram() {
  const W = 720, H = 360;

  // Warstwy: 6 (wejście) — 6 (ukryta 1) — 6 (ukryta 2) — 6 (wyjście)
  // Dla czytelności rysunku pokazujemy mniej neuronów (3 — 4 — 4 — 3) z "..."
  const layers = [
    { x: 100, label: "wejście", labelDetail: "poza T (6 liczb)", color: "#0ea5e9", neurons: ["x", "y", "z", "·", "·", "·"] },
    { x: 280, label: "warstwa 1", labelDetail: "64 neurony, tanh", color: "#a855f7", neurons: ["", "", "", "", "·", "·"] },
    { x: 460, label: "warstwa 2", labelDetail: "64 neurony, tanh", color: "#a855f7", neurons: ["", "", "", "", "·", "·"] },
    { x: 640, label: "wyjście", labelDetail: "kąty (6 liczb)", color: "#10b981", neurons: ["q₁", "q₂", "q₃", "q₄", "q₅", "q₆"] },
  ];

  const yTop = 60;
  const yGap = 40;

  // Pozycje neuronów per warstwa
  const positions = layers.map((L) =>
    L.neurons.map((_, i) => ({ x: L.x, y: yTop + i * yGap })),
  );

  // Połączenia (każdy z każdym)
  const connections: { x1: number; y1: number; x2: number; y2: number; w: number }[] = [];
  for (let li = 0; li < layers.length - 1; li++) {
    for (const a of positions[li]) {
      for (const b of positions[li + 1]) {
        // pseudo-losowa waga dla wizualizacji (deterministyczna, na podstawie pozycji)
        const w = Math.sin((a.y * 13 + b.y * 7 + li * 17) * 0.01);
        connections.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, w });
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      {/* Połączenia (linie z różnymi grubościami symulującymi wagi) */}
      {connections.map((c, i) => (
        <line
          key={i}
          x1={c.x1} y1={c.y1}
          x2={c.x2} y2={c.y2}
          stroke={c.w > 0 ? "#60a5fa" : "#fb923c"}
          strokeWidth={Math.abs(c.w) * 1.5 + 0.2}
          opacity={0.45}
        />
      ))}

      {/* Neurony */}
      {layers.map((L, li) =>
        L.neurons.map((label, ni) => (
          <g key={`${li}-${ni}`}>
            <circle
              cx={positions[li][ni].x}
              cy={positions[li][ni].y}
              r={14}
              fill="white"
              stroke={L.color}
              strokeWidth={2}
            />
            <text
              x={positions[li][ni].x}
              y={positions[li][ni].y + 4}
              fontSize={11}
              fontFamily="monospace"
              fill="#334155"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        )),
      )}

      {/* Etykiety warstw */}
      {layers.map((L, li) => (
        <g key={`label-${li}`}>
          <text
            x={L.x}
            y={H - 50}
            fontSize={12}
            fontFamily="system-ui"
            fill={L.color}
            fontWeight={700}
            textAnchor="middle"
          >
            {L.label}
          </text>
          <text
            x={L.x}
            y={H - 34}
            fontSize={10}
            fontFamily="system-ui"
            fill="#64748b"
            textAnchor="middle"
          >
            {L.labelDetail}
          </text>
        </g>
      ))}

      {/* Strzałki kierunku przepływu danych */}
      {[1, 2, 3].map((i) => (
        <text
          key={i}
          x={(layers[i - 1].x + layers[i].x) / 2}
          y={H - 80}
          fontSize={16}
          fill="#94a3b8"
          textAnchor="middle"
        >
          →
        </text>
      ))}

      {/* Legenda na górze */}
      <g transform={`translate(${W - 240}, 18)`}>
        <rect x={0} y={0} width={228} height={60} fill="#f8fafc" stroke="#e5e7eb" rx={4} />
        <text x={8} y={16} fontSize={10} fontFamily="system-ui" fill="#334155" fontWeight={600}>
          Każda linia = jedna waga (parametr).
        </text>
        <line x1={10} y1={26} x2={40} y2={26} stroke="#60a5fa" strokeWidth={2} />
        <text x={48} y={30} fontSize={10} fontFamily="system-ui" fill="#334155">waga dodatnia</text>
        <line x1={10} y1={42} x2={40} y2={42} stroke="#fb923c" strokeWidth={2} />
        <text x={48} y={46} fontSize={10} fontFamily="system-ui" fill="#334155">waga ujemna</text>
        <text x={140} y={30} fontSize={10} fontFamily="system-ui" fill="#64748b" fontStyle="italic">grubość ≈ |waga|</text>
      </g>

      {/* Top tekst */}
      <text x={W / 2} y={28} fontSize={13} fontFamily="system-ui" fill="#334155" textAnchor="middle" fontWeight={600}>
        MLP: liczby wchodzą z lewej, wychodzą z prawej, w środku — mnożenia i dodawania
      </text>
    </svg>
  );
}
