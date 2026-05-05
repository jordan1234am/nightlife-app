import { Link, useLocation } from "wouter";
import { NavBar } from "@/components/NavBar";
import { VIBES, VibeType } from "@/data/venues";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(null);
  const [, setLocation] = useLocation();

  // Load previously selected vibe if it exists
  useEffect(() => {
    const saved = sessionStorage.getItem("tonightgc_vibe") as VibeType;
    if (saved && VIBES.includes(saved)) {
      setSelectedVibe(saved);
    }
  }, []);

  const handleVibeSelect = (vibe: VibeType) => {
    setSelectedVibe(vibe);
    sessionStorage.setItem("tonightgc_vibe", vibe);
  };

  const handleFindNight = () => {
    if (selectedVibe) {
      setLocation("/tonight");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-20 md:pb-0 pt-0 md:pt-16 overflow-x-hidden">
      <NavBar />
      
      <main className="max-w-md md:max-w-4xl mx-auto px-4 pt-12 md:pt-20 pb-8 flex flex-col min-h-[calc(100dvh-5rem)]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 mt-auto"
        >
          <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight text-white mb-4 leading-[1.1]">
            Where should you go <span className="text-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] block md:inline">tonight</span> on the GC?
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Pick your vibe. See the best spots tonight. No bullshit, just good times.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-12 flex-1"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {VIBES.map((vibe) => (
            <motion.button
              key={vibe}
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
              onClick={() => handleVibeSelect(vibe)}
              className={cn(
                "relative p-4 md:p-6 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all duration-300",
                selectedVibe === vibe 
                  ? "bg-primary/20 border-primary text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]" 
                  : "bg-card/50 border-border hover:bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground"
              )}
              data-testid={`vibe-btn-${vibe.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {selectedVibe === vibe && (
                <motion.div 
                  layoutId="vibe-indicator"
                  className="absolute inset-0 rounded-xl border-2 border-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="font-display font-semibold text-lg relative z-10">{vibe}</span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div 
          className="mt-auto pt-4 sticky bottom-4 md:static"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <button
            onClick={handleFindNight}
            disabled={!selectedVibe}
            className={cn(
              "w-full py-4 rounded-xl font-display font-bold text-lg transition-all duration-300 uppercase tracking-widest",
              selectedVibe 
                ? "bg-primary text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:bg-primary/90" 
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
            data-testid="btn-find-night"
          >
            Find my night
          </button>
        </motion.div>
      </main>
    </div>
  );
}
