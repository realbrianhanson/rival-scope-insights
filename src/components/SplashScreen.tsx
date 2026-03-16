import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSettings } from "@/hooks/useAppSettings";

interface SplashScreenProps {
  ready: boolean;
  onComplete: () => void;
}

export function SplashScreen({ ready, onComplete }: SplashScreenProps) {
  const { data: settings } = useAppSettings();
  const appName = settings?.app_name || "RivalScope";
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (ready) {
      // Small delay so the exit animation plays after content is ready
      const timer = setTimeout(() => setVisible(false), 100);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{ background: "hsl(var(--background))" }}
        >
          {/* Gradient mesh — very low opacity */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full blur-[140px] mesh-circle-1" style={{ background: 'hsl(164 100% 42% / 0.04)' }} />
            <div className="absolute bottom-[15%] right-[20%] w-[450px] h-[450px] rounded-full blur-[130px] mesh-circle-2" style={{ background: 'hsl(252 58% 64% / 0.03)' }} />
            <div className="absolute top-[50%] right-[10%] w-[400px] h-[400px] rounded-full blur-[120px] mesh-circle-3" style={{ background: 'hsl(22 100% 60% / 0.02)' }} />
          </div>

          <motion.div
            className="relative z-10 flex flex-col items-center"
            exit={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            {/* Wordmark */}
            <h1 className="font-display text-4xl text-foreground tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              {appName}
            </h1>

            {/* Loading bar */}
            <div className="mt-6 w-[200px] h-[2px] bg-muted rounded-full overflow-hidden">
              <div className="h-full w-full splash-loader-bar" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
