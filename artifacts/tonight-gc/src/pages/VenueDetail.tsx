import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { NavBar } from "@/components/NavBar";
import { Venue } from "@/data/venues";
import { useVenues } from "@/hooks/useVenues";
import { ArrowLeft, MapPin, Clock, Users, Music, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function VenueDetail() {
  const [, params] = useRoute("/venues/:id");
  const [venue, setVenue] = useState<Venue | null>(null);
  const { venues } = useVenues();

  useEffect(() => {
    if (params?.id && venues.length > 0) {
      const v = venues.find((v) => v.id === params.id);
      if (v) setVenue(v);
    }
  }, [params?.id, venues]);

  if (!venue) {
    return (
      <div className="min-h-[100dvh] bg-background pb-20 md:pb-0 md:pt-16 flex flex-col">
        <NavBar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Venue not found</h2>
          <Link href="/venues" className="text-primary hover:underline">Return to venues</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-20 md:pb-0 md:pt-16">
      <NavBar />
      
      {/* Hero Image Section */}
      <div className="relative h-[40vh] md:h-[50vh] w-full bg-muted">
        {venue.imageUrl ? (
          <img 
            src={venue.imageUrl} 
            alt={venue.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-background">
            <span className="text-6xl font-bold text-muted-foreground/20 font-display uppercase tracking-widest">{venue.name.substring(0, 2)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <Link href="/venues" className="absolute top-4 left-4 z-10 p-2 bg-background/40 backdrop-blur-md rounded-full text-white hover:bg-background/60 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <main className="max-w-4xl mx-auto px-4 -mt-32 relative z-10 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/80 backdrop-blur-xl border border-border p-6 md:p-8 rounded-2xl shadow-2xl mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {venue.vibes.map(vibe => (
                  <Badge key={vibe} className="bg-primary/20 text-primary border-primary/30 font-medium tracking-wide">
                    {vibe}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl font-black font-display text-white mb-2">{venue.name}</h1>
              <div className="flex items-center text-muted-foreground gap-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  {venue.suburb}
                </div>
                <div className="font-mono font-bold text-white px-2 py-0.5 rounded bg-white/10 text-sm">
                  {"$".repeat(venue.priceLevel)}
                </div>
              </div>
            </div>
          </div>

          <p className="text-lg text-foreground/90 leading-relaxed">
            {venue.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1 space-y-6"
          >
            <div className="bg-card border border-border p-5 rounded-xl">
              <h3 className="font-display font-bold text-lg mb-4 text-white">The Details</h3>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Best time to arrive</p>
                    <p className="text-sm text-muted-foreground">{venue.bestArrivalTime}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Crowd level</p>
                    <p className="text-sm text-muted-foreground capitalize">{venue.crowdLevel}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Music className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Music</p>
                    <p className="text-sm text-muted-foreground">{venue.musicType}</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-card border border-border p-5 rounded-xl">
              <h3 className="font-display font-bold text-lg mb-3 text-white">Dress Code</h3>
              <p className="text-sm text-muted-foreground">{venue.dressCode}</p>
            </div>
            
            <div className="bg-card border border-border p-5 rounded-xl">
              <h3 className="font-display font-bold text-lg mb-3 text-white">Best Nights</h3>
              <div className="flex flex-wrap gap-2">
                {venue.bestNights.map(night => (
                  <Badge key={night} variant="secondary" className="bg-secondary text-secondary-foreground border-border">
                    {night}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Deep Dive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 space-y-6"
          >
            <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 text-primary">
                <ExternalLink className="h-24 w-24" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-primary">Why we recommend it</h3>
              <p className="text-foreground italic relative z-10 text-lg">"{venue.recommendedReason}"</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border p-5 rounded-xl">
                <h3 className="font-display font-bold text-lg mb-4 text-white flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Great For
                </h3>
                <ul className="space-y-2">
                  {venue.goodFor.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl">
                <h3 className="font-display font-bold text-lg mb-4 text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Not Ideal For
                </h3>
                <ul className="space-y-2">
                  {venue.notIdealFor.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
