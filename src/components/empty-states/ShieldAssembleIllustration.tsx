export function ShieldAssembleIllustration() {
  return (
    <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes shield-top-left { 0% { transform: translate(-12px, -12px); opacity: 0; } 100% { transform: translate(0, 0); opacity: 1; } }
        @keyframes shield-top-right { 0% { transform: translate(12px, -12px); opacity: 0; } 100% { transform: translate(0, 0); opacity: 1; } }
        @keyframes shield-bot-left { 0% { transform: translate(-12px, 12px); opacity: 0; } 100% { transform: translate(0, 0); opacity: 1; } }
        @keyframes shield-bot-right { 0% { transform: translate(12px, 12px); opacity: 0; } 100% { transform: translate(0, 0); opacity: 1; } }
      `}</style>
      {/* Top-left quadrant */}
      <path d="M50 15 L50 60 L22 60 L22 35 Q22 15 50 15Z" fill="hsl(var(--muted))" opacity="0.3"
        style={{ animation: 'shield-top-left 0.8s ease-out 0.2s both' }} />
      {/* Top-right quadrant */}
      <path d="M50 15 Q78 15 78 35 L78 60 L50 60 L50 15Z" fill="hsl(var(--muted))" opacity="0.35"
        style={{ animation: 'shield-top-right 0.8s ease-out 0.4s both' }} />
      {/* Bottom-left quadrant */}
      <path d="M22 60 L50 60 L50 100 L35 90 Q22 80 22 60Z" fill="hsl(var(--muted))" opacity="0.25"
        style={{ animation: 'shield-bot-left 0.8s ease-out 0.6s both' }} />
      {/* Bottom-right quadrant — teal accent */}
      <path d="M50 60 L78 60 Q78 80 65 90 L50 100 L50 60Z" fill="hsl(164 100% 42%)" opacity="0.2"
        style={{ animation: 'shield-bot-right 0.8s ease-out 0.8s both' }} />
      {/* Shield outline */}
      <path d="M50 15 Q78 15 78 35 L78 60 Q78 80 65 90 L50 100 L35 90 Q22 80 22 60 L22 35 Q22 15 50 15Z"
        stroke="hsl(var(--muted))" strokeWidth="1.5" fill="none" opacity="0.4"
        style={{ animation: 'shield-top-left 1s ease-out 1s both' }} />
    </svg>
  );
}
