export function CrosshairIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes reticle-rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes orbit-dot { 0% { transform: rotate(0deg) translateX(40px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(40px) rotate(-360deg); } }
      `}</style>
      {/* Rotating reticle group */}
      <g style={{ transformOrigin: '60px 60px', animation: 'reticle-rotate 10s linear infinite' }}>
        {/* Outer ring */}
        <circle cx="60" cy="60" r="32" stroke="hsl(var(--muted))" strokeWidth="1" fill="none" opacity="0.5" />
        {/* Cross lines */}
        <line x1="60" y1="24" x2="60" y2="40" stroke="hsl(var(--muted))" strokeWidth="1.5" opacity="0.6" />
        <line x1="60" y1="80" x2="60" y2="96" stroke="hsl(var(--muted))" strokeWidth="1.5" opacity="0.6" />
        <line x1="24" y1="60" x2="40" y2="60" stroke="hsl(var(--muted))" strokeWidth="1.5" opacity="0.6" />
        <line x1="80" y1="60" x2="96" y2="60" stroke="hsl(var(--muted))" strokeWidth="1.5" opacity="0.6" />
        {/* Inner ring */}
        <circle cx="60" cy="60" r="16" stroke="hsl(var(--muted))" strokeWidth="0.5" fill="none" opacity="0.3" />
      </g>
      {/* Center glow */}
      <circle cx="60" cy="60" r="6" fill="hsl(164 100% 42%)" opacity="0.15" />
      <circle cx="60" cy="60" r="3" fill="hsl(164 100% 42%)" opacity="0.6" />
      {/* Orbit dots */}
      <g style={{ transformOrigin: '60px 60px', animation: 'reticle-rotate 15s linear infinite reverse' }}>
        <circle cx="100" cy="60" r="2.5" fill="hsl(var(--muted))" opacity="0.4" />
        <circle cx="60" cy="20" r="2" fill="hsl(var(--muted))" opacity="0.3" />
        <circle cx="20" cy="60" r="2" fill="hsl(var(--muted))" opacity="0.35" />
      </g>
    </svg>
  );
}
