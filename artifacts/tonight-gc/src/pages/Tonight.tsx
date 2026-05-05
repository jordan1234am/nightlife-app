import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { NavBar } from "@/components/NavBar";
import { VenueCard } from "@/components/VenueCard";
import { getVenues, Venue, VibeType } from "@/data/venues";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Tonight() {
  const [, setLocation] = useLocation();
  const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    const vibe = sessionStorage.getItem("tonightgc_vibe") as VibeType;
    if (!vibe) {
      setLocation("/");
      return;
    }
    
    setSelectedVibe(vibe);
    
    const allVenues = getVenues();
    const filtered = allVenues.filter(v => v.vibes.includes(vibe));
    
    // Sort roughly by recommendation power - for a real app this would have an algorithm
    setVenues(filtered);
  }, [setLocation]);

  if (!selectedVibe) return null;

  return (
    <div className="min-h-[100dvh] bg-background pb-20 md:pb-0 md:pt-16">
      <NavBar />
      
      <main className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Change vibe
        </Link>
        
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-block px-3 py-1 bg-primary/20 border border-primary/30 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-3"
          >
            Tonight's Playbook
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black font-display text-white"
          >
            {selectedVibe}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-2 max-w-lg"
          >
            We've curated the absolute best spots for {selectedVibe.toLowerCase()} on the GC tonight.
          </motion.p>
        </div>

        {venues.length === 0 ? (
          <div className="text-center py-20 bg-card/30 rounded-2xl border border-border border-dashed">
            <p className="text-lg text-muted-foreground">No venues found for this vibe.</p>
            <Link href="/" className="text-primary hover:underline mt-2 inline-block">Try another vibe</Link>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {venues.map((venue) => (
              <motion.div
                key={venue.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <VenueCard venue={venue} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
