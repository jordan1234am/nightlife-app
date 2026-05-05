import { Link } from "wouter";
import { Clock, MapPin, Users } from "lucide-react";
import { Venue } from "@/data/venues";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  return (
    <Card className="overflow-hidden group hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-card/50 backdrop-blur-sm">
      <div className="relative h-48 bg-muted overflow-hidden">
        {venue.imageUrl ? (
          <img 
            src={venue.imageUrl} 
            alt={venue.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/80 to-background">
            <span className="text-4xl font-bold text-muted-foreground/20 font-display uppercase tracking-widest">{venue.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div>
            <h3 className="font-display font-bold text-xl text-white drop-shadow-md">{venue.name}</h3>
            <div className="flex items-center text-xs text-muted-foreground gap-1 font-medium mt-1">
              <MapPin className="h-3 w-3" />
              {venue.suburb}
            </div>
          </div>
          <div className="font-mono font-bold text-primary bg-background/80 px-2 py-1 rounded backdrop-blur-md text-sm border border-primary/20">
            {"$".repeat(venue.priceLevel)}
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {venue.vibes.slice(0, 3).map(vibe => (
            <Badge key={vibe} variant="secondary" className="text-[10px] font-medium uppercase tracking-wider bg-secondary/50 text-secondary-foreground border-border/50">
              {vibe}
            </Badge>
          ))}
        </div>
        
        <p className="text-sm text-foreground/80 line-clamp-2 mb-5 h-10">
          {venue.recommendedReason || venue.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-5 border-t border-border/50 pt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary/70" />
            <span>Arrive {venue.bestArrivalTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary/70" />
            <span className="capitalize">{venue.crowdLevel} crowd</span>
          </div>
        </div>
        
        <Link href={`/venues/${venue.id}`} className="block w-full">
          <div className="w-full text-center text-sm font-semibold text-primary py-2.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20 hover:border-primary/40 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            View Details
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
