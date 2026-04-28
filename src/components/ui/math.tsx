"use client";

import katex from "katex";
import { useMemo } from "react";

type MathProps = {
  tex: string;
  block?: boolean;
  className?: string;
};

export function Math({ tex, block = false, className }: MathProps) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        strict: "ignore",
        trust: true,
      }),
    [tex, block],
  );

  if (block) {
    return (
      <div
        className={`katex-block ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function MathBlock(props: Omit<MathProps, "block">) {
  return <Math {...props} block />;
}
