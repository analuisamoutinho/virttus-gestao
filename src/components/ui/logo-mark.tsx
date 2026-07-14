"use client";

import { useId } from "react";

// Símbolo "V humano" + estrela da marca Virttus.
// Usa useId para gerar um id de gradiente único por instância — evita colisão
// quando há mais de um logo na página (ex.: barra mobile + rail desktop).
export function LogoMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const gid = `vLogo-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Virttus"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* estrela / sparkle */}
      <path
        d="M20 3.2 L21.5 7.1 L25.4 8.6 L21.5 10.1 L20 14 L18.5 10.1 L14.6 8.6 L18.5 7.1 Z"
        fill="#7C3AED"
      />
      {/* V — dois traços em gradiente */}
      <path
        d="M7.5 14.5 L19 34.5 Q20 36 21 34.5 L32.5 14.5"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* figura humana: cabeça + braços erguidos */}
      <circle cx="20" cy="18.6" r="2.9" fill={`url(#${gid})`} />
      <path
        d="M14.7 25.2 C16.4 19.8 23.6 19.8 25.3 25.2"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
