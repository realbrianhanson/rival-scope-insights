export function RadarPingIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes radar-ping-1 { 0% { r: 8; opacity: 0.5; } 100% { r: 45; opacity: 0; } }
        @keyframes radar-ping-2 { 0% { r: 8; opacity: 0.4; } 100% { r: 45; opacity: 0; } }
        @keyframes radar-ping-3 { 0% { r: 8; opacity: 0.3; } 100% { r: 45; opacity: 0; } }
      `}</style>
      {/* Concentric ping circles */}
      <circle cx="60" cy="60" r="8" stroke="hsl(164 100% 42%)" strokeWidth="1.5" fill="none" opacity="0">
        <animate attributeName="r" values="8;45" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="60" r="8" stroke="hsl(164 100% 42%)" strokeWidth="1.5" fill="none" opacity="0">
        <animate attributeName="r" values="8;45" dur="2s" begin="0.7s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0" dur="2s" begin="0.7s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="60" r="8" stroke="hsl(164 100% 42%)" strokeWidth="1.5" fill="none" opacity="0">
        <animate attributeName="r" values="8;45" dur="2s" begin="1.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0" dur="2s" begin="1.4s" repeatCount="indefinite" />
      </circle>
      {/* Center dot */}
      <circle cx="60" cy="60" r="4" fill="hsl(164 100% 42%)" opacity="0.8" />
      {/* Unconnected competitor dots */}
      <circle cx="30" cy="38" r="3" fill="hsl(var(--muted))" opacity="0.5" />
      <circle cx="88" cy="44" r="3" fill="hsl(var(--muted))" opacity="0.5" />
      <circle cx="40" cy="90" r="3" fill="hsl(var(--muted))" opacity="0.5" />
      <circle cx="82" cy="85" r="3" fill="hsl(var(--muted))" opacity="0.5" />
      <circle cx="22" cy="65" r="2.5" fill="hsl(var(--muted))" opacity="0.4" />
      <circle cx="98" cy="62" r="2.5" fill="hsl(var(--muted))" opacity="0.4" />
    </svg>
  );
}
