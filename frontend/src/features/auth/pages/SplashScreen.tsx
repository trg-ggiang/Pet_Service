import { useEffect, useState } from "react";
import { SplashView } from "../../../components/auth/SplashView";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase(1), 200);
    const t2 = window.setTimeout(() => setPhase(2), 900);
    const t3 = window.setTimeout(onDone, 3000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onDone]);

  useEffect(() => {
    if (phase < 2) return;
    let current = 0;
    const id = window.setInterval(() => {
      current += 1.8;
      setProgress(Math.min(current, 100));
      if (current >= 100) window.clearInterval(id);
    }, 32);
    return () => window.clearInterval(id);
  }, [phase]);

  return <SplashView phase={phase} progress={progress} />;
}
