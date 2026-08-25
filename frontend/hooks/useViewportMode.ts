"use client";

import { useEffect, useState } from "react";

export type ViewportMode = "mobile" | "tablet" | "desktop";

export function useViewportMode() {
  const [mode, setMode] = useState<ViewportMode | null>(null);

  useEffect(() => {
    const tablet = window.matchMedia("(max-width: 1023px)");
    const mobile = window.matchMedia("(max-width: 767px)");

    const update = () => {
      if (mobile.matches) {
        setMode("mobile");
        return;
      }
      if (tablet.matches) {
        setMode("tablet");
        return;
      }
      setMode("desktop");
    };

    update();
    tablet.addEventListener("change", update);
    mobile.addEventListener("change", update);
    return () => {
      tablet.removeEventListener("change", update);
      mobile.removeEventListener("change", update);
    };
  }, []);

  return mode;
}
