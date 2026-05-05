import { useState, useMemo } from "react";
import { NavBar } from "@/components/NavBar";
import { VenueCard } from "@/components/VenueCard";
import { getVenues, SUBURBS, VIBES, SuburbType, VibeType } from "@/data/venues";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Venues() {
  const [search, setSearch] = useState("");
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbType | "All">("All");
  const [selectedVibe, setSelectedVibe] = useState<VibeType | "All">("All");
  
  const allVenues = useMemo(() => getVenues(), []);
  
  const filteredVenues = useMemo(() => {
    return allVenues.filter(venue => {
      const matchesSearch = venue.name.toLowerCase().includes(search.toLowerCase()) || 
                           venue.description.toLowerCase().includes(search.toLowerCase());
      const matchesSuburb = selectedSuburb === "All" || venue.suburb === selectedSuburb;
      const matchesVibe = selectedVibe === "All" || venue.vibes.includes(selectedVibe);
      
      return matchesSearch && matchesSuburb && matchesVibe;
    });
  }, [allVenues, search, selectedSuburb, selectedVibe]);

  return (
    <div className="min-h-[100dvh] bg-background pb-20 md:pb-0 md:pt-16">
      <NavBar />
      
      <main className="max-w-6xl mx-auto px-4 pt-8 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black font-display text-white mb-2">All Venues</h1>
          <p className="text-muted-foreground">The complete directory of GC nightlife.</p>
        </div>

        <div className="bg-card/50 border border-border rounded-xl p-4 mb-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search venues..." 
                className="pl-9 bg-background/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-venues"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <select 
                className="bg-background/50 border border-input rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary outline-none"
                value={selectedSuburb}
                onChange={(e) => setSelectedSuburb(e.target.value as any)}
                data-testid="select-suburb"
              >
                <option value="All">All Suburbs</option>
                {SUBURBS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <select 
                className="bg-background/50 border border-input rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary outline-none"
                value={selectedVibe}
                onChange={(e) => setSelectedVibe(e.target.value as any)}
                data-testid="select-vibe"
              >
                <option value="All">All Vibes</option>
                {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-muted-foreground font-medium">
          Showing {filteredVenues.length} {filteredVenues.length === 1 ? 'venue' : 'venues'}
        </div>

        {filteredVenues.length === 0 ? (
          <div className="text-center py-20 bg-card/30 rounded-2xl border border-border border-dashed">
            <Filter className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No venues found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
            <button 
              onClick={() => {
                setSearch("");
                setSelectedSuburb("All");
                setSelectedVibe("All");
              }}
              className="text-primary hover:underline mt-4"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
            {filteredVenues.map((venue) => (
              <motion.div
                key={venue.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: { opacity: 1, scale: 1 }
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
