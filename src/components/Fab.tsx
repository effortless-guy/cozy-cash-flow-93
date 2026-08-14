import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

export function Fab({
  onClick,
  label = "Add",
}: {
  onClick: () => void;
  label?: string;
}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY.current;
        if (Math.abs(dy) > 6) {
          if (dy > 0 && y > 40) setHidden(true);
          else if (dy < 0) setHidden(false);
          lastY.current = y;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/15 ring-1 ring-border transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
        hidden
          ? "pointer-events-none translate-y-6 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <Plus className="h-6 w-6" strokeWidth={2.25} />
    </button>
  );
}