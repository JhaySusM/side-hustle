export default function LineChart({ values }) {
  const width = 520;
  const height = 94;
  const paddingX = 8;
  const paddingY = 8;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  const points = values.map((value, index) => {
    const x = paddingX + step * index;
    const normalized = (value - min) / range;
    const y = paddingY + innerHeight - normalized * innerHeight;
    return { x, y, value };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const areaPath = `${path} L ${(points[points.length - 1]?.x ?? width).toFixed(2)} ${(height - paddingY).toFixed(2)} L ${(points[0]?.x ?? paddingX).toFixed(2)} ${(height - paddingY).toFixed(2)} Z`;
  const gridY = [0.2, 0.5, 0.8].map((ratio) => paddingY + innerHeight * ratio);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {gridY.map((y, index) => (
        <line key={index} className="chart-grid" x1={paddingX} y1={y.toFixed(2)} x2={width - paddingX} y2={y.toFixed(2)} />
      ))}
      <path className="chart-area" d={areaPath} />
      <path className="chart-line" d={path} />
      {points.map((point, index) => (
        <circle
          key={index}
          className={`chart-point${index === points.length - 1 ? " is-latest" : ""}`}
          cx={point.x.toFixed(2)}
          cy={point.y.toFixed(2)}
          r={index === points.length - 1 ? 4.5 : 3.2}
        />
      ))}
    </svg>
  );
}
