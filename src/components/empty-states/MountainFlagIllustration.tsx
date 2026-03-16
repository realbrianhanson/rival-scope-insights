export function MountainFlagIllustration() {
  return (
    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes flag-plant {
          0% { transform: translateY(8px); opacity: 0; }
          60% { transform: translateY(-3px); opacity: 1; }
          80% { transform: translateY(1px); }
          100% { transform: translateY(0); }
        }
        @keyframes flag-wave {
          0%, 100% { d: path("M70 18 L85 23 L70 28"); }
          50% { d: path("M70 18 L87 22 L70 27"); }
        }
      `}</style>
      {/* Mountain range */}
      <path d="M0 90 L25 50 L45 70 L70 25 L95 55 L115 40 L140 90 Z" 
        fill="none" stroke="hsl(var(--muted))" strokeWidth="1.5" opacity="0.4" />
      <path d="M0 90 L25 50 L45 70 L70 25 L95 55 L115 40 L140 90" 
        fill="hsl(var(--muted))" opacity="0.06" />
      {/* Ground line */}
      <line x1="0" y1="90" x2="140" y2="90" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.2" />
      {/* Flag pole and flag at peak */}
      <g style={{ animation: 'flag-plant 0.8s ease-out 0.5s both' }}>
        <line x1="70" y1="25" x2="70" y2="10" stroke="hsl(164 100% 42%)" strokeWidth="1.5" opacity="0.8" />
        <path d="M70 10 L82 15 L70 20" fill="hsl(164 100% 42%)" opacity="0.6" />
      </g>
    </svg>
  );
}
