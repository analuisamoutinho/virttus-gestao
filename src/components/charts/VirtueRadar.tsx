import { VIRTUES } from "@/lib/virtues";
import type { Virtue } from "@prisma/client";

// Radar SVG das 9 virtudes (eneágono). scores: 0–10 por virtude.
export function VirtueRadar({
  scores,
  size = 260,
  max = 10,
}: {
  scores: Partial<Record<Virtue, number>>;
  size?: number;
  max?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34; // margem p/ labels
  const n = VIRTUES.length;

  // ângulo: começa no topo (-90°) e gira sentido horário
  const angleFor = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const point = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angleFor(i)),
    y: cy + radius * Math.sin(angleFor(i)),
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const gridPolygon = (frac: number) =>
    VIRTUES.map((_, i) => {
      const p = point(i, r * frac);
      return `${p.x},${p.y}`;
    }).join(" ");

  const dataPolygon = VIRTUES.map((v, i) => {
    const val = Math.max(0, Math.min(max, scores[v.key] ?? 0));
    const p = point(i, r * (val / max));
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto h-auto w-full max-w-[300px]"
      role="img"
      aria-label="Radar das 9 virtudes do time"
    >
      <defs>
        <linearGradient id="virtueGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* grade */}
      {rings.map((frac) => (
        <polygon
          key={frac}
          points={gridPolygon(frac)}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={1}
        />
      ))}
      {VIRTUES.map((_, i) => {
        const p = point(i, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        );
      })}

      {/* dados */}
      <polygon
        points={dataPolygon}
        fill="url(#virtueGrad)"
        stroke="#7C3AED"
        strokeWidth={2}
      />

      {/* labels */}
      {VIRTUES.map((v, i) => {
        const p = point(i, r + 18);
        const anchor =
          Math.abs(p.x - cx) < 8 ? "middle" : p.x > cx ? "start" : "end";
        return (
          <text
            key={v.key}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={8}
            fill="#64748B"
            fontFamily="var(--font-inter), sans-serif"
          >
            {v.label}
          </text>
        );
      })}
    </svg>
  );
}
