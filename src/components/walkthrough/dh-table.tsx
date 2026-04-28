import { PUMA_A2, PUMA_A3, PUMA_D3, PUMA_D4 } from "@/lib/robots/puma560";
import { Math as M } from "@/components/ui/math";

export function DHTablePuma560() {
  const rows = [
    { i: 1, alpha: "0", a: "0", d: "0", theta: "q_1" },
    { i: 2, alpha: "-\\pi/2", a: "0", d: "0", theta: "q_2" },
    { i: 3, alpha: "0", a: `a_2 = ${PUMA_A2}`, d: `d_3 = ${PUMA_D3}`, theta: "q_3" },
    { i: 4, alpha: "-\\pi/2", a: `a_3 = ${PUMA_A3}`, d: `d_4 = ${PUMA_D4}`, theta: "q_4" },
    { i: 5, alpha: "\\pi/2", a: "0", d: "0", theta: "q_5" },
    { i: 6, alpha: "-\\pi/2", a: "0", d: "0", theta: "q_6" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="text-sm">
        <thead>
          <tr>
            <th><M tex="i" /></th>
            <th><M tex="\alpha_{i-1}" /></th>
            <th><M tex="a_{i-1}\;[\text{m}]" /></th>
            <th><M tex="d_i\;[\text{m}]" /></th>
            <th><M tex="\theta_i" /></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.i}>
              <td className="font-mono">{r.i}</td>
              <td><M tex={r.alpha} /></td>
              <td><M tex={r.a} /></td>
              <td><M tex={r.d} /></td>
              <td><M tex={r.theta} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
