export default function TrendLine({ values, gmv = false }) {
  if (!values.length) return null;

  const width = 520;
  const height = 132;
  const paddingX = 10;
  const paddingY = 10;
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
    return { x, y };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const areaPath = `${path} L ${(points[points.length - 1]?.x ?? width - paddingX).toFixed(2)} ${(height - paddingY).toFixed(2)} L ${(points[0]?.x ?? paddingX).toFixed(2)} ${(height - paddingY).toFixed(2)} Z`;

  return (
    <div className={`analytics-trend-line${gmv ? " gmv" : ""}`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <path className="trend-area" d={areaPath} />
        <path className="trend-path" d={path} />
      </svg>
    </div>
  );
}
