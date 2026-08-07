export default function BarChart({ values, labels, valueFormatter = (v) => v, accentIndex, colors }) {
  const max = Math.max(1, ...values);

  return (
    <div className="bar-chart">
      {values.map((value, index) => {
        const color = colors ? colors[index % colors.length] : accentIndex === index ? "var(--accent)" : "var(--teal)";
        return (
          <div className="bar-col" key={index}>
            <div className="bar-val">{valueFormatter(value)}</div>
            <div className="bar" style={{ height: `${(value / max) * 100}%`, background: color }} />
            <div className="bar-lbl">{labels[index]}</div>
          </div>
        );
      })}
    </div>
  );
}
