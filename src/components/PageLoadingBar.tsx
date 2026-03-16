import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";

export function PageLoadingBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const start = useCallback(() => {
    setVisible(true);
    setProgress(0);

    // Fast start
    timerRef.current = setTimeout(() => setProgress(30), 50);
    
    // Slow middle
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + (90 - prev) * 0.08;
      });
    }, 200);
  }, []);

  const complete = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    start();
    // Complete on next frame after render
    const raf = requestAnimationFrame(() => {
      const timer = setTimeout(complete, 150);
      return () => clearTimeout(timer);
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname, start, complete]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms" }}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : progress === 100 ? "width 200ms ease-out" : "width 400ms ease-out",
        }}
      />
    </div>
  );
}
