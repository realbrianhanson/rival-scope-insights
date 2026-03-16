export function DocumentDrawIllustration() {
  return (
    <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes draw-line { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
      `}</style>
      {/* Document body */}
      <rect x="15" y="10" width="70" height="100" rx="6" stroke="hsl(var(--muted))" strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Folded corner */}
      <path d="M70 10 L85 25" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
      {/* Text lines drawing in */}
      <line x1="28" y1="38" x2="72" y2="38" stroke="hsl(var(--muted))" strokeWidth="2" strokeLinecap="round" strokeDasharray="44" strokeDashoffset="0" opacity="0.4">
        <animate attributeName="stroke-dashoffset" values="44;0" dur="1.2s" fill="freeze" />
      </line>
      <line x1="28" y1="50" x2="65" y2="50" stroke="hsl(var(--muted))" strokeWidth="2" strokeLinecap="round" strokeDasharray="37" strokeDashoffset="0" opacity="0.35">
        <animate attributeName="stroke-dashoffset" values="37;0" dur="1.2s" begin="0.3s" fill="freeze" />
      </line>
      <line x1="28" y1="62" x2="70" y2="62" stroke="hsl(var(--muted))" strokeWidth="2" strokeLinecap="round" strokeDasharray="42" strokeDashoffset="0" opacity="0.3">
        <animate attributeName="stroke-dashoffset" values="42;0" dur="1.2s" begin="0.6s" fill="freeze" />
      </line>
      <line x1="28" y1="74" x2="55" y2="74" stroke="hsl(var(--muted))" strokeWidth="2" strokeLinecap="round" strokeDasharray="27" strokeDashoffset="0" opacity="0.25">
        <animate attributeName="stroke-dashoffset" values="27;0" dur="1.2s" begin="0.9s" fill="freeze" />
      </line>
      {/* Final line in teal */}
      <line x1="28" y1="86" x2="60" y2="86" stroke="hsl(164 100% 42%)" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="0" opacity="0.7">
        <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" begin="1.2s" fill="freeze" />
      </line>
    </svg>
  );
}
