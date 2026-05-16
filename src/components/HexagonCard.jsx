function GpuFan({ cx, cy, duration = '8s' }) {
  return (
    <g>
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${cx} ${cy}`}
          to={`360 ${cx} ${cy}`}
          dur={duration}
          repeatCount="indefinite"
        />
        <circle
          cx={cx}
          cy={cy}
          r={22}
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="0.5"
        />
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={angle}
              x1={cx + Math.cos(rad) * 8}
              y1={cy + Math.sin(rad) * 8}
              x2={cx + Math.cos(rad) * 18}
              y2={cy + Math.sin(rad) * 18}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.5"
            />
          );
        })}
      </g>
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.5"
      />
    </g>
  );
}

export default function HexagonCard() {
  return (
    <div className="relative opacity-90">
      <svg width="200" height="220" viewBox="0 0 200 220" aria-hidden="true">
        <polygon
          points="100,12 178,55 178,145 100,188 22,145 22,55"
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />
        <GpuFan cx={72} cy={108} duration="9s" />
        <GpuFan cx={128} cy={108} duration="6.5s" />
      </svg>
    </div>
  );
}
