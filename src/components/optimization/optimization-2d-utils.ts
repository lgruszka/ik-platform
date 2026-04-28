/**
 * Wspólne narzędzia dla wizualizacji 2D optymalizacji w module 4.
 * Funkcja kosztu paraboliczna asymetryczna — studenci łatwo zobaczą
 * konsekwencje skalowania (GD wolny w „dolinie", NM się dopasowuje).
 */

export type Pt2 = { x: number; y: number };

// Funkcja kosztu: f(x, y) = 0.5·(x−2)² + 2·(y−1)²
// Minimum w (2, 1), wartość 0. Kontury to elipsy o stosunku osi √(b/a) = 2.
export function cost(p: Pt2): number {
  return 0.5 * (p.x - 2) ** 2 + 2 * (p.y - 1) ** 2;
}

export function grad(p: Pt2): Pt2 {
  return { x: p.x - 2, y: 4 * (p.y - 1) };
}

// Stałe minimum dla referencji
export const X_STAR: Pt2 = { x: 2, y: 1 };

// Zakresy widoku
export const X_MIN = -3, X_MAX = 5;
export const Y_MIN = -3, Y_MAX = 4;

// Poziomy konturów do narysowania
export const LEVELS = [0.25, 1, 2.5, 5, 10, 18, 28, 40];

/**
 * Parametryczna elipsa dla poziomu c funkcji f. Zwraca punkty na konturze.
 * Dla f(x,y) = 0.5·(x−2)² + 2·(y−1)² = c:
 *   (x−2)² / (2c) + (y−1)² / (c/2) = 1
 *   x = 2 + √(2c)·cos(θ), y = 1 + √(c/2)·sin(θ)
 */
export function contourPoints(level: number, n: number = 64): Pt2[] {
  const a = Math.sqrt(2 * level);
  const b = Math.sqrt(level / 2);
  const out: Pt2[] = [];
  for (let i = 0; i <= n; i++) {
    const theta = (i / n) * 2 * Math.PI;
    out.push({ x: 2 + a * Math.cos(theta), y: 1 + b * Math.sin(theta) });
  }
  return out;
}

// Helper do zamiany koordynatów świata → SVG
export function makeProjector(plotX: number, plotY: number, plotW: number, plotH: number) {
  const scaleX = plotW / (X_MAX - X_MIN);
  const scaleY = plotH / (Y_MAX - Y_MIN);
  return {
    sx: (x: number) => plotX + (x - X_MIN) * scaleX,
    sy: (y: number) => plotY + (Y_MAX - y) * scaleY, // y odwrócone (SVG)
  };
}
