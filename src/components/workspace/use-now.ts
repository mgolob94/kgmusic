"use client";

import { useEffect, useState } from "react";
import { nowLjubljana } from "@/lib/date";

/** Trenutni čas v Ljubljani, osvežen vsakih 30 s. Začetna vrednost pride s strežnika (brez hydration napake). */
export function useNow(initial: { date: string; time: string; minutes: number }) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    const tick = () => setNow(nowLjubljana());
    tick();
    const id = setInterval(tick, 30_000);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return now;
}
