/**
 * Schemat porównujący różne konwencje kątów Eulera. Pokazuje że "kąty Eulera"
 * to nie jeden zapis, lecz cała rodzina (XYZ, ZYX, ZYZ, XYZ extrinsic vs
 * intrinsic, …). Wybór konwencji to umowa — komunikuj się z otoczeniem!
 */
export function EulerConventionsDiagram() {
  const W = 720, H = 280;

  const items = [
    { name: "Roll-Pitch-Yaw (RPY)", order: "ZYX intrinsic", common: "Robotyka, lotnictwo, ROS", color: "#0ea5e9" },
    { name: "Tait-Bryan XYZ", order: "XYZ intrinsic", common: "Grafika 3D, Unity", color: "#a855f7" },
    { name: "Eulera ZYZ", order: "ZYZ intrinsic", common: "Mechanika klasyczna", color: "#10b981" },
    { name: "Eulera ZXZ", order: "ZXZ intrinsic", common: "Astronomia, mechanika ciał sztywnych", color: "#f59e0b" },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel)]">
      <text x={W / 2} y={26} fontSize={13} fontFamily="system-ui" fill="#334155" textAnchor="middle" fontWeight={600}>
        12 różnych „kątów Eulera" (× 2 dla intrinsic vs extrinsic = 24 konwencje)
      </text>
      <text x={W / 2} y={44} fontSize={11} fontFamily="system-ui" fill="#64748b" textAnchor="middle" fontStyle="italic">
        Te same trzy liczby (np. 30°, 45°, 60°) dają RÓŻNE rotacje w różnych konwencjach
      </text>

      {items.map((it, i) => {
        const y = 70 + i * 48;
        return (
          <g key={i}>
            <rect x={20} y={y} width={W - 40} height={36} rx={6} fill="white" stroke={it.color} strokeWidth={2} />
            <rect x={20} y={y} width={6} height={36} rx={3} fill={it.color} />
            <text x={36} y={y + 16} fontSize={12} fontFamily="system-ui" fill="#334155" fontWeight={600}>
              {it.name}
            </text>
            <text x={36} y={y + 30} fontSize={11} fontFamily="monospace" fill={it.color}>
              {it.order}
            </text>
            <text x={W - 30} y={y + 22} fontSize={11} fontFamily="system-ui" fill="#64748b" textAnchor="end">
              {it.common}
            </text>
          </g>
        );
      })}

      <text x={W / 2} y={H - 14} fontSize={11} fontFamily="system-ui" fill="#64748b" textAnchor="middle" fontStyle="italic">
        Nie istnieje „prawidłowa" konwencja — istnieje konwencja, którą używasz w swoim systemie.
      </text>
    </svg>
  );
}
