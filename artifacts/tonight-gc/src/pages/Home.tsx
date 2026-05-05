import { useLocation } from "wouter";
import { VIBES, VibeType } from "@/data/venues";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const VIBE_DESCRIPTIONS: Record<VibeType, string> = {
  "Big Night":    "Dance floors & clubs",
  "Chill Drinks": "Bars & sunsets",
  "Date Night":   "Intimate & classy",
  "Cheap Night":  "Great value spots",
  "Live Music":   "Bands & live sets",
  "Food First":   "Eat then explore",
};

export default function Home() {
  const [, setLocation] = useLocation();

  const handleVibeSelect = (vibe: VibeType) => {
    sessionStorage.setItem("tonightgc_vibe", vibe);
    setLocation("/map");
  };

  return (
    <div className="min-h-[100dvh] bg-[#08090f] overflow-x-hidden flex flex-col">
      <main className="flex flex-col flex-1 max-w-md mx-auto w-full px-5 pt-16 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="text-zinc-600 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Gold Coast</p>
          <h1 className="text-4xl font-black font-display tracking-tight text-white leading-[1.05] mb-3">
            Where should you go{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
              tonight?
            </span>
          </h1>
          <p className="text-zinc-500 text-base">Pick your vibe — we'll show you where the energy is.</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 gap-3 flex-1"
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
        >
          {VIBES.map((vibe) => (
            <motion.button
              key={vibe}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              onClick={() => handleVibeSelect(vibe)}
              className={cn(
                "relative p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex flex-col items-start gap-1.5 text-left",
                "active:scale-[0.97] transition-all duration-150",
                "hover:border-violet-500/40 hover:bg-zinc-900"
              )}
              data-testid={`vibe-btn-${vibe.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span className="font-display font-bold text-white text-lg leading-tight">{vibe}</span>
              <span className="text-zinc-500 text-xs">{VIBE_DESCRIPTIONS[vibe]}</span>
              <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-violet-500 opacity-60" />
            </motion.button>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
