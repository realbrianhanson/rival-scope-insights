export function ComparisonBarsIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes bar-grow-1 { 0% { height: 0; y: 85; } 100% { height: 50; y: 35; } }
        @keyframes bar-grow-2 { 0% { height: 0; y: 85; } 100% { height: 35; y: 50; } }
        @keyframes dash-connect { 0% { stroke-dashoffset: 40; opacity: 0; } 100% { stroke-dashoffset: 0; opacity: 0.4; } }
      `}</style>
      {/* Base line */}
      <line x1="20" y1="85" x2="100" y2="85" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
      {/* Left bar - purple */}
      <rect x="35" y="35" width="18" height="50" rx="3" fill="hsl(252 58% 64%)" opacity="0.35">
        <animate attributeName="height" values="0;50" dur="0.8s" fill="freeze" />
        <animate attributeName="y" values="85;35" dur="0.8s" fill="freeze" />
      </rect>
      {/* Right bar - teal */}
      <rect x="67" y="50" width="18" height="35" rx="3" fill="hsl(164 100% 42%)" opacity="0.35">
        <animate attributeName="height" values="0;35" dur="0.8s" begin="0.2s" fill="freeze" />
        <animate attributeName="y" values="85;50" dur="0.8s" begin="0.2s" fill="freeze" />
      </rect>
      {/* Dotted connector line */}
      <line x1="44" y1="35" x2="76" y2="50" stroke="hsl(var(--muted))" strokeWidth="1" strokeDasharray="4 3" opacity="0">
        <animate attributeName="opacity" values="0;0.4" dur="0.5s" begin="1s" fill="freeze" />
      </line>
    </svg>
  );
}
