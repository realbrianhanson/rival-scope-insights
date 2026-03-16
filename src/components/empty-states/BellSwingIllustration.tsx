export function BellSwingIllustration() {
  return (
    <svg width="100" height="110" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes bell-swing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(6deg); }
          30% { transform: rotate(-5deg); }
          45% { transform: rotate(4deg); }
          60% { transform: rotate(-3deg); }
          75% { transform: rotate(1deg); }
        }
        @keyframes notif-fade {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.5; }
        }
      `}</style>
      {/* Bell group with swing */}
      <g style={{ transformOrigin: '50px 20px', animation: 'bell-swing 3s ease-in-out infinite' }}>
        {/* Bell body */}
        <path d="M50 25 C50 25 35 30 35 50 L35 65 Q35 70 30 72 L70 72 Q65 70 65 65 L65 50 C65 30 50 25 50 25Z"
          stroke="hsl(var(--muted))" strokeWidth="1.5" fill="hsl(var(--muted))" fillOpacity="0.1" opacity="0.5" />
        {/* Clapper */}
        <circle cx="50" cy="78" r="3" fill="hsl(var(--muted))" opacity="0.4" />
        {/* Top nub */}
        <circle cx="50" cy="22" r="3" fill="hsl(var(--muted))" opacity="0.4" />
      </g>
      {/* Notification dots fading */}
      <circle cx="72" cy="28" r="3" fill="hsl(var(--muted))" opacity="0" style={{ animation: 'notif-fade 2.5s ease-in-out infinite' }} />
      <circle cx="78" cy="40" r="2" fill="hsl(var(--muted))" opacity="0" style={{ animation: 'notif-fade 2.5s ease-in-out 0.8s infinite' }} />
      <circle cx="25" cy="35" r="2.5" fill="hsl(var(--muted))" opacity="0" style={{ animation: 'notif-fade 2.5s ease-in-out 1.5s infinite' }} />
    </svg>
  );
}
