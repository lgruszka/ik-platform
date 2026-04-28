import Image from "next/image";

type Props = {
  src: string;                       // np. /images/dh/dh-transformation.svg
  alt: string;
  caption: string;                   // podpis merytoryczny (po polsku)
  author: string;                    // np. "Jahobr"
  license: string;                   // np. "Public Domain" / "CC-BY-SA 4.0"
  sourceUrl: string;                 // link do strony na Commons
  licenseUrl?: string;               // link do tekstu licencji
  height?: number;                   // wysokość renderowanego obrazka [px]
};

/**
 * Wyświetla grafikę z Wikimedia Commons wraz z obowiązkową (lub grzecznościową)
 * atrybucją. Dla CC-BY-SA atrybucja jest wymaganiem licencyjnym; dla PD
 * zostawiamy ją jako dobre obyczaje akademickie.
 */
export function CommonsImage({
  src,
  alt,
  caption,
  author,
  license,
  sourceUrl,
  licenseUrl,
  height = 360,
}: Props) {
  return (
    <figure className="rounded-lg border border-[var(--panel-border)] bg-white overflow-hidden my-4">
      <div className="flex justify-center items-center p-4" style={{ height }}>
        <Image
          src={src}
          alt={alt}
          width={height * 1.4}
          height={height}
          style={{ height: "100%", width: "auto", maxWidth: "100%" }}
          unoptimized
        />
      </div>
      <figcaption className="px-4 py-2 border-t border-[var(--panel-border)] bg-[var(--panel)] text-xs text-[var(--muted)]">
        <div className="text-[var(--foreground)] mb-1">{caption}</div>
        <div>
          Źródło:{" "}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--accent)]">
            Wikimedia Commons
          </a>
          {" · "}autor: {author}
          {" · "}licencja:{" "}
          {licenseUrl ? (
            <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--accent)]">
              {license}
            </a>
          ) : (
            license
          )}
        </div>
      </figcaption>
    </figure>
  );
}
