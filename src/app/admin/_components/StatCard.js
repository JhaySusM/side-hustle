export default function StatCard({ label, value, delta, deltaClass = "", icon, className = "", valueStyle, deltaStyle }) {
  return (
    <div className={`stat dashboard-stat ${className}`.trim()}>
      <div className="label">{label}</div>
      <div className="val" style={valueStyle}>{value}</div>
      {delta ? (
        <div className={`delta ${deltaClass}`.trim()} style={deltaStyle}>
          {delta}
        </div>
      ) : null}
      {icon ? <div className="ic-bg">{icon}</div> : null}
    </div>
  );
}
