// ============================
// VENUE DATA — Edit venues here
// ============================

export type VibeType = "Big Night" | "Chill Drinks" | "Date Night" | "Cheap Night" | "Live Music" | "Food First";
export type SuburbType = "Surfers Paradise" | "Broadbeach" | "Burleigh" | "Miami" | "Coolangatta";

export interface Venue {
  id: string;
  name: string;
  suburb: SuburbType;
  vibes: VibeType[];
  priceLevel: 1 | 2 | 3;
  crowdLevel: "Low" | "Medium" | "High";
  bestArrivalTime: string;
  bestNights: string[];
  dressCode: string;
  musicType: string;
  description: string;
  imageUrl: string;
  goodFor: string[];
  notIdealFor: string[];
  recommendedReason: string;
}

const SEED_VENUES: Venue[] = [
  {
    id: "surfers-pavilion",
    name: "Surfers Pavilion",
    suburb: "Surfers Paradise",
    vibes: ["Chill Drinks", "Date Night"],
    priceLevel: 2,
    crowdLevel: "Medium",
    bestArrivalTime: "7pm",
    bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Smart casual",
    musicType: "Acoustic, chill vibes",
    description: "Relaxed beachside bar with great cocktails and ocean views. Perfect for a sunset drink or a laid-back date.",
    imageUrl: "https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=800&q=80",
    goodFor: ["Couples", "Small groups", "Sunset drinks"],
    notIdealFor: ["Big groups", "Late night clubbing"],
    recommendedReason: "Best sunset cocktails on the strip — book a table and let the ocean do the rest."
  },
  {
    id: "cali-beach",
    name: "Cali Beach",
    suburb: "Surfers Paradise",
    vibes: ["Big Night"],
    priceLevel: 2,
    crowdLevel: "High",
    bestArrivalTime: "10pm",
    bestNights: ["Friday", "Saturday"],
    dressCode: "Smart casual to dressy",
    musicType: "Commercial house, Top 40",
    description: "High-energy beachfront club with multiple bars and a pumping dancefloor. The go-to for a big night out on the GC.",
    imageUrl: "https://images.unsplash.com/photo-1571266028243-d220c6853fa9?w=800&q=80",
    goodFor: ["Groups", "Dancing", "Late nights"],
    notIdealFor: ["Quiet catch-ups", "Early evenings"],
    recommendedReason: "If you want to actually dance tonight, this is the move. Gets going properly around 11pm."
  },
  {
    id: "the-avenue",
    name: "The Avenue",
    suburb: "Surfers Paradise",
    vibes: ["Big Night"],
    priceLevel: 3,
    crowdLevel: "High",
    bestArrivalTime: "11pm",
    bestNights: ["Friday", "Saturday"],
    dressCode: "Dressy",
    musicType: "R&B, Hip Hop, Commercial",
    description: "GC's premier nightclub. Multiple levels, VIP areas, big-name DJs. The place to be seen on a Saturday night.",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    goodFor: ["Big groups", "VIP experience", "Dancing"],
    notIdealFor: ["Budget nights", "Casual drinks"],
    recommendedReason: "The biggest club on the coast. Go late, go dressy, go hard."
  },
  {
    id: "burleigh-pavilion",
    name: "Burleigh Pavilion",
    suburb: "Burleigh",
    vibes: ["Chill Drinks", "Date Night"],
    priceLevel: 2,
    crowdLevel: "Medium",
    bestArrivalTime: "6pm",
    bestNights: ["Thursday", "Friday", "Saturday", "Sunday"],
    dressCode: "Casual smart",
    musicType: "Laid back, indie, acoustic",
    description: "Iconic clifftop bar overlooking Burleigh Beach. One of the most beautiful spots on the GC for a drink.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    goodFor: ["Couples", "Catch-ups", "Sundowners"],
    notIdealFor: ["Clubbing", "Late nights"],
    recommendedReason: "Arguably the best view on the Gold Coast. Go for sundowners and stay for dinner."
  },
  {
    id: "miami-marketta",
    name: "Miami Marketta",
    suburb: "Miami",
    vibes: ["Live Music", "Food First"],
    priceLevel: 1,
    crowdLevel: "Medium",
    bestArrivalTime: "6pm",
    bestNights: ["Friday", "Saturday"],
    dressCode: "Casual",
    musicType: "Live bands, acoustic sets, eclectic",
    description: "GC's favourite street food market with live music, craft beers and heaps of food stalls. Great atmosphere, great value.",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    goodFor: ["Families", "Groups", "Foodies", "Music lovers"],
    notIdealFor: ["Clubbers", "Late night crowd"],
    recommendedReason: "Best value night out on the GC. Great food, live music, zero pretense."
  },
  {
    id: "loose-moose",
    name: "Loose Moose",
    suburb: "Broadbeach",
    vibes: ["Food First", "Big Night"],
    priceLevel: 1,
    crowdLevel: "High",
    bestArrivalTime: "8pm",
    bestNights: ["Wednesday", "Thursday", "Friday", "Saturday"],
    dressCode: "Casual",
    musicType: "Pop, Commercial, Party hits",
    description: "Lively pub with great food, drinks specials and a fun party atmosphere. Always a good time.",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9359815b6b5c?w=800&q=80",
    goodFor: ["Groups", "Budget nights", "Pub lovers"],
    notIdealFor: ["Quiet evenings", "Couples"],
    recommendedReason: "Cold beer, good pub food, and a crowd that's actually having fun. Solid every time."
  },
  {
    id: "justin-lane",
    name: "Justin Lane",
    suburb: "Burleigh",
    vibes: ["Date Night", "Food First"],
    priceLevel: 2,
    crowdLevel: "Medium",
    bestArrivalTime: "7pm",
    bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Smart casual",
    musicType: "Ambient, indie",
    description: "Rooftop pizza bar and cocktail lounge in the heart of Burleigh. Great vibes for a date or a group dinner.",
    imageUrl: "https://images.unsplash.com/photo-1559524071-1fdcf9f98b88?w=800&q=80",
    goodFor: ["Couples", "Foodies", "Rooftop lovers"],
    notIdealFor: ["Big groups", "Night owls"],
    recommendedReason: "Best rooftop in Burleigh. The pizza is legit and the cocktail list is long."
  },
  {
    id: "coolangatta-hotel",
    name: "Coolangatta Hotel",
    suburb: "Coolangatta",
    vibes: ["Live Music", "Big Night"],
    priceLevel: 1,
    crowdLevel: "High",
    bestArrivalTime: "8pm",
    bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Casual",
    musicType: "Live rock, cover bands, local artists",
    description: "Legendary live music pub at the southern end of the GC. Great local bands, good prices, real pub culture.",
    imageUrl: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&q=80",
    goodFor: ["Music lovers", "Locals", "Budget nights"],
    notIdealFor: ["Clubbers", "Fancy nights"],
    recommendedReason: "The most authentic pub on the GC. Live music every weekend and the cheapest drinks around."
  }
];

const STORAGE_KEY = "tonightgc_venues";

export function getVenues(): Venue[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const customVenues: Venue[] = JSON.parse(stored);
      return [...SEED_VENUES, ...customVenues];
    }
  } catch (e) {
    console.error("Failed to load venues from localStorage", e);
  }
  return SEED_VENUES;
}

export function saveVenue(venue: Venue): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let customVenues: Venue[] = [];
    if (stored) {
      customVenues = JSON.parse(stored);
    }
    
    const existingIndex = customVenues.findIndex(v => v.id === venue.id);
    if (existingIndex >= 0) {
      customVenues[existingIndex] = venue;
    } else {
      customVenues.push(venue);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customVenues));
  } catch (e) {
    console.error("Failed to save venue to localStorage", e);
  }
}

export function deleteVenue(id: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      let customVenues: Venue[] = JSON.parse(stored);
      customVenues = customVenues.filter(v => v.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customVenues));
    }
  } catch (e) {
    console.error("Failed to delete venue from localStorage", e);
  }
}

export function getVenueById(id: string): Venue | undefined {
  const venues = getVenues();
  return venues.find(v => v.id === id);
}

export const VIBES: VibeType[] = [
  "Big Night", 
  "Chill Drinks", 
  "Date Night", 
  "Cheap Night", 
  "Live Music", 
  "Food First"
];

export const SUBURBS: SuburbType[] = [
  "Surfers Paradise", 
  "Broadbeach", 
  "Burleigh", 
  "Miami", 
  "Coolangatta"
];
