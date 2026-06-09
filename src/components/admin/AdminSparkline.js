"use client";

/**
 * A lightweight, SVG-based sparkline for showing data trends.
 * Designed to sit subtly behind or next to big numbers.
 */
export default function AdminSparkline({ 
  data = [], 
  width = 120, 
  height = 40, 
  color = "#10b981", 
  strokeWidth = 2,
  fill = false
}) {
  if (!data?.length || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Map data to SVG coordinates
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return { x, y };
  });

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      className="overflow-visible"
      preserveAspectRatio="none"
    >
      {fill && (
        <path
          d={areaData}
          fill={color}
          fillOpacity={0.1}
          className="transition-all duration-500"
        />
      )}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}
