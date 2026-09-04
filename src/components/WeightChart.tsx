import React, { useState } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { WeightRecord } from "../types";

interface WeightChartProps {
  records: WeightRecord[];
  displayUnit: "kg" | "lbs";
}

export const WeightChart: React.FC<WeightChartProps> = ({ records, displayUnit }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (records.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 p-6 text-center">
        <p className="text-sm font-semibold text-slate-600">No weigh-in records to chart yet</p>
        <p className="text-xs text-slate-400 mt-1">Log your first weight entry above to start charting your trend</p>
      </div>
    );
  }

  // Sort chronologically for chart display (oldest to newest)
  const sorted = [...records].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  // Convert weights to current display unit
  const points = sorted.map((r) => {
    let w = r.weight;
    if (r.unit !== displayUnit) {
      w = r.unit === "kg" && displayUnit === "lbs" ? w * 2.20462 : w / 2.20462;
    }
    return {
      id: r.id,
      date: new Date(r.logged_at),
      weight: Number(w.toFixed(1)),
      notes: r.notes,
      raw: r,
    };
  });

  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const padding = Math.max(1, (maxW - minW) * 0.2);
  const yMin = Math.floor(minW - padding);
  const yMax = Math.ceil(maxW + padding);
  const yRange = yMax - yMin || 1;

  // SVG dimensions
  const width = 600;
  const height = 180;
  const padX = 40;
  const padY = 24;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const getX = (index: number) => {
    if (points.length === 1) return padX + chartW / 2;
    return padX + (index / (points.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padY + chartH - ((val - yMin) / yRange) * chartH;
  };

  const polylinePoints = points.map((p, i) => `${getX(i)},${getY(p.weight)}`).join(" ");

  // Trend direction
  const firstW = points[0].weight;
  const lastW = points[points.length - 1].weight;
  const delta = Number((lastW - firstW).toFixed(1));

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-50">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">Weight Progression Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Weekly trajectory calculated from SQL database records</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {delta < 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
              <TrendingDown className="w-3.5 h-3.5" />
              {delta} {displayUnit} overall
            </span>
          ) : delta > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600">
              <TrendingUp className="w-3.5 h-3.5" />
              +{delta} {displayUnit} overall
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              <Minus className="w-3.5 h-3.5" />
              Maintained
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="sleekIndigoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid horizontal lines */}
          {[0, 0.5, 1].map((ratio) => {
            const val = yMin + ratio * yRange;
            const y = getY(val);
            return (
              <g key={ratio}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />
                <text
                  x={padX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  {val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area fill under curve if more than 1 point */}
          {points.length > 1 && (
            <polygon
              points={`${padX},${padY + chartH} ${polylinePoints} ${getX(points.length - 1)},${padY + chartH}`}
              fill="url(#sleekIndigoGradient)"
            />
          )}

          {/* Main Trend Line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {/* Interactive Data Dots */}
          {points.map((p, i) => {
            const cx = getX(i);
            const cy = getY(p.weight);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={p.id}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Invisible larger hit target */}
                <circle cx={cx} cy={cy} r="14" fill="transparent" />

                {/* Outer ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? "7" : "4.5"}
                  fill="white"
                  stroke="#4f46e5"
                  strokeWidth={isHovered ? "3" : "2.5"}
                  className="transition-all duration-150"
                />

                {/* X axis date label */}
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                  fontFamily="sans-serif"
                  fontWeight="500"
                >
                  {p.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white px-3.5 py-2 rounded-2xl text-xs shadow-xl space-y-0.5"
            style={{
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: `${(getY(points[hoveredIdx].weight) / height) * 100}%`,
              marginTop: "-10px",
            }}
          >
            <div className="font-bold flex items-center gap-2">
              <span className="text-white">{points[hoveredIdx].weight} {displayUnit}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {points[hoveredIdx].date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            {points[hoveredIdx].notes && (
              <div className="text-[10px] text-slate-300 italic max-w-xs truncate">
                "{points[hoveredIdx].notes}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
