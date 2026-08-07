import { polarToCartesian } from "../../_lib/deriveCharts";

export default function DonutChart({ slices }) {
  if (!slices.length) {
    return (
      <svg viewBox="0 0 96 96">
        <circle r="44" cx="48" cy="48" fill="#e5e7eb" />
      </svg>
    );
  }

  const total = slices.reduce((sum, slice) => sum + slice.count, 0) || 1;
  const radius = 44;
  const cx = 48;
  const cy = 48;

  const arcs = slices.reduce((acc, slice) => {
    const previousEnd = acc.length ? acc[acc.length - 1].endAngle : -90;
    const sweep = (slice.count / total) * 360;
    acc.push({ slice, startAngle: previousEnd, endAngle: previousEnd + sweep });
    return acc;
  }, []);

  const paths = arcs.map(({ slice, startAngle, endAngle }, index) => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    const d = `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
    return <path key={index} d={d} fill={slice.color} />;
  });

  return (
    <svg viewBox="0 0 96 96">
      {paths}
    </svg>
  );
}
