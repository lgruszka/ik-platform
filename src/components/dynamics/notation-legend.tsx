import { Math as M } from "@/components/ui/math";

/**
 * Legenda notacji używanej w wyprowadzeniu Newton-Eulera.
 *
 * Konwencja Craig'a: lewy górny indeks = "w jakim układzie współrzędnych
 * wektor jest wyrażony"; prawy dolny = "o jakim obiekcie mówimy".
 * Bez tej legendy student spotyka się z ⁱp_{i+1} po raz pierwszy w eq. 6.6
 * i nie wie, że to nie jest "macierz do potęgi i".
 */
export function NotationLegend() {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-5 py-4 my-4 not-prose">
      <p className="font-semibold mb-2">Legenda notacji — czytaj zanim wejdziesz w równania</p>
      <p className="text-sm text-[var(--foreground)] mb-3">
        Newton-Euler operuje wektorami wyrażonymi w <em>różnych układach
        współrzędnych</em> (jeden na ogniwo). Konwencja Craig'a zapisuje to
        za pomocą <strong>lewego górnego indeksu</strong>:
      </p>
      <div className="overflow-x-auto">
        <table className="text-sm w-full">
          <thead>
            <tr className="border-b border-[var(--panel-border)]">
              <th className="text-left py-2 pr-4 font-semibold w-1/3">Symbol</th>
              <th className="text-left py-2 font-semibold">Znaczenie</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-[var(--panel-border)]/40">
            <tr>
              <td className="py-2 pr-4"><M tex="{}^i\mathbf{v}" /></td>
              <td className="py-2">wektor <M tex="\mathbf{v}" /> wyrażony w układzie ogniwa <em>i</em> (jego współrzędne to liczby w bazie {"{"}<M tex="\hat x_i, \hat y_i, \hat z_i" />{"}"})</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><M tex="{}^i\mathbf{p}_{i+1}" /></td>
              <td className="py-2">pozycja <em>początku układu (i+1)</em>, wyrażona w układzie (i) — czyli „gdzie patrząc z ogniwa i znajduje się następny przegub"</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><M tex="{}^i\mathbf{p}_{Ci}" /></td>
              <td className="py-2">pozycja środka masy <em>własnego</em> ogniwa <em>i</em>, w jego własnym układzie (stała geometryczna)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><M tex="{}^{i+1}R_i" /></td>
              <td className="py-2">macierz rotacji <em>z układu (i) do (i+1)</em> — bierze wektor wyrażony w (i), zwraca jego współrzędne w (i+1)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><M tex="\boldsymbol\omega,\ \boldsymbol\varepsilon" /></td>
              <td className="py-2">prędkość i przyspieszenie kątowe ogniwa</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><M tex="\mathbf{v},\ \mathbf{a}" /></td>
              <td className="py-2">prędkość i przyspieszenie liniowe <em>początku układu</em> ogniwa</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><M tex="\mathbf{v}_{Ci},\ \mathbf{a}_{Ci}" /></td>
              <td className="py-2">prędkość i przyspieszenie <em>środka masy</em> ogniwa (inne niż początku!)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><M tex="\mathbf{F}_{Ci},\ \mathbf{N}_{Ci}" /></td>
              <td className="py-2">siła i moment <em>bezwładności</em> w środku masy (z równań Newtona i Eulera)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><M tex="\mathbf{f}_i,\ \mathbf{n}_i" /></td>
              <td className="py-2">siła i moment <em>reakcji</em> w przegubie <em>i</em> (to, co ogniwo (i-1) działa na ogniwo i)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><M tex="\tau_i" /></td>
              <td className="py-2">skalarny <em>moment napędowy</em> — to, co musi wytworzyć silnik (rzut <M tex="\mathbf{n}_i" /> na oś przegubu <M tex="\hat z_i" />)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-[var(--muted)] mt-3 mb-0">
        <strong>Złota zasada:</strong> zanim pomnożysz dwa wektory, sprawdź czy
        są wyrażone w tym samym układzie. Jeśli nie — najpierw rotacja{" "}
        <M tex="{}^iR_j" />, dopiero potem działanie.
      </p>
    </div>
  );
}
