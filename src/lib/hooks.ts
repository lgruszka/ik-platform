"use client";

import { useEffect, useState } from "react";

/**
 * Zwraca `true` dopiero po pierwszym mount na kliencie. Służy do bramkowania
 * komputacji, które mogą zwrócić różne wartości na serwerze i w przeglądarce
 * (np. `performance.now()`, `Math.random()`), i w ten sposób zapobiega
 * hydration mismatch.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
