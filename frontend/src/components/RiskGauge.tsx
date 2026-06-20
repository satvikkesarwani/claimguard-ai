// ClaimGuard AI — semicircular risk gauge (0-100) with band coloring.
import { riskHex } from "../utils/format";

export default function RiskGauge({
  score,
  category,
  size = 200,
}: {
  score: number;
  category: string;
  size?: number;
}) {
  const radius = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius; // semicircle
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color = riskHex(category);

  // Semicircle from 180deg -> 0deg
  const start = polar(cx, cy, radius, 180);
  const end = polar(cx, cy, radius, 0);
  const progressEnd = polar(cx, cy, radius, 180 - pct * 180);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="#eef2f7"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${pct > 0.5 ? 1 : 0} 1 ${progressEnd.x} ${progressEnd.y}`}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ transition: "all 0.8s ease" }}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-navy" style={{ fontSize: 34, fontWeight: 800 }}>
          {score}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 12, fontWeight: 600 }}>
          / 100
        </text>
      </svg>
      <span
        className="mt-1 chip"
        style={{ backgroundColor: color + "1a", color }}
      >
        {category}
      </span>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}
