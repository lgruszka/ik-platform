import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  src: string;
  alt: string;
  caption: ReactNode;
  /** Numer rysunku z dysertacji, np. "6.2". */
  figureNumber: string;
  /** Maksymalna szerokość obrazka [px]. Domyślnie 720. */
  maxWidth?: number;
  /** Naturalne wymiary pliku — wymagane przez Next/Image dla statycznych assetów. */
  width: number;
  height: number;
};

/**
 * Wrapper na obrazki wycinane bezpośrednio z dysertacji [Gruszka 2024].
 * Wyświetla obraz + numer rysunku + podpis + atrybucję źródłową.
 *
 * Konwencja zgodna z `<CommonsImage />` (atrybucja Wikimedia Commons), ale dla
 * źródeł autorskich (rysunki własne autora pracy magisterskiej/doktorskiej).
 */
export function DissertationFigure({
  src, alt, caption, figureNumber, maxWidth = 720, width, height,
}: Props) {
  return (
    <figure className="not-prose my-6">
      <div className="rounded-lg border border-[var(--panel-border)] bg-white overflow-hidden mx-auto" style={{ maxWidth }}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-auto"
          unoptimized
        />
      </div>
      <figcaption className="mt-2 text-xs text-[var(--muted)] mx-auto" style={{ maxWidth }}>
        <strong className="text-[var(--foreground)]">Rys. {figureNumber}.</strong> {caption}
        <span className="block mt-1 italic text-[10px]">
          Źródło: [Gruszka, dysertacja 2024], rys. {figureNumber}.
        </span>
      </figcaption>
    </figure>
  );
}
