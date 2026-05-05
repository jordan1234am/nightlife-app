// ============================
// VENUE DATA — Edit venues here
// Each venue needs lat/lng for the heat map layer.
// Coordinates are approximate GC positions.
// ============================

export type VibeType = "Big Night" | "Chill Drinks" | "Date Night" | "Cheap Night" | "Live Music" | "Food First";
export type SuburbType = "Surfers Paradise" | "Broadbeach" | "Burleigh" | "Miami" | "Coolangatta";

export interface Venue {
  id: string;
  name: string;
  suburb: SuburbType;
  // Exact lat/lng for the heat map (optional for user-added venues)
  lat?: number;
  lng?: number;
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

// ============================
// SEED VENUES — Edit or add venues here.
// Group by suburb for readability.
// ============================
const SEED_VENUES: Venue[] = [

  // ── SURFERS PARADISE ──────────────────────────────────────────────────────
  {
    id: "surfers-pavilion",
    name: "Surfers Pavilion",
    suburb: "Surfers Paradise",
    lat: -28.002, lng: 153.432,
    vibes: ["Chill Drinks", "Date Night"],
    priceLevel: 2, crowdLevel: "Medium",
    bestArrivalTime: "7pm", bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Smart casual", musicType: "Acoustic, chill vibes",
    description: "Relaxed beachside bar with great cocktails and ocean views.",
    imageUrl: "https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=800&q=80",
    goodFor: ["Couples", "Small groups", "Sunset drinks"],
    notIdealFor: ["Big groups", "Late night clubbing"],
    recommendedReason: "Best sunset cocktails on the strip — book a table and let the ocean do the rest.",
  },
  {
    id: "cali-beach",
    name: "Cali Beach",
    suburb: "Surfers Paradise",
    lat: -28.003, lng: 153.430,
    vibes: ["Big Night"],
    priceLevel: 2, crowdLevel: "High",
    bestArrivalTime: "10pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Smart casual to dressy", musicType: "Commercial house, Top 40",
    description: "High-energy beachfront club with multiple bars and a pumping dancefloor.",
    imageUrl: "https://images.unsplash.com/photo-1571266028243-d220c6853fa9?w=800&q=80",
    goodFor: ["Groups", "Dancing", "Late nights"],
    notIdealFor: ["Quiet catch-ups", "Early evenings"],
    recommendedReason: "If you want to actually dance tonight, this is the move. Gets going properly around 11pm.",
  },
  {
    id: "the-avenue",
    name: "The Avenue",
    suburb: "Surfers Paradise",
    lat: -28.004, lng: 153.427,
    vibes: ["Big Night"],
    priceLevel: 3, crowdLevel: "High",
    bestArrivalTime: "11pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Dressy", musicType: "R&B, Hip Hop, Commercial",
    description: "GC's premier nightclub. Multiple levels, VIP areas, big-name DJs.",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    goodFor: ["Big groups", "VIP experience", "Dancing"],
    notIdealFor: ["Budget nights", "Casual drinks"],
    recommendedReason: "The biggest club on the coast. Go late, go dressy, go hard.",
  },
  {
    id: "sin-city",
    name: "SinCity",
    suburb: "Surfers Paradise",
    lat: -28.003, lng: 153.428,
    vibes: ["Big Night"],
    priceLevel: 2, crowdLevel: "High",
    bestArrivalTime: "11pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Dressy casual", musicType: "EDM, Commercial house",
    description: "Multi-room nightclub on the Orchid Ave strip. Huge dancefloor, multiple bars, always packed late.",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    goodFor: ["Groups", "Big nights", "Late finishers"],
    notIdealFor: ["Early nights", "Quiet drinks"],
    recommendedReason: "Orchid Ave's biggest party. Peak crowd after midnight — get in early or queue.",
  },
  {
    id: "bedroom-lounge-bar",
    name: "Bedroom Lounge Bar",
    suburb: "Surfers Paradise",
    lat: -28.002, lng: 153.429,
    vibes: ["Chill Drinks", "Big Night"],
    priceLevel: 2, crowdLevel: "Medium",
    bestArrivalTime: "9pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Smart casual", musicType: "Lounge, RnB, commercial",
    description: "Relaxed lounge bar that heats up as the night progresses. Good for pre-drinks or a full session.",
    imageUrl: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800&q=80",
    goodFor: ["Pre-drinks", "Mixed groups", "Night starters"],
    notIdealFor: ["Early dinners", "Family groups"],
    recommendedReason: "Perfect bridge between sunset drinks and the main event. Relaxed start, lively finish.",
  },

  // ── BROADBEACH ────────────────────────────────────────────────────────────
  {
    id: "loose-moose",
    name: "Loose Moose",
    suburb: "Broadbeach",
    lat: -28.028, lng: 153.432,
    vibes: ["Food First", "Big Night"],
    priceLevel: 1, crowdLevel: "High",
    bestArrivalTime: "8pm", bestNights: ["Wednesday", "Thursday", "Friday", "Saturday"],
    dressCode: "Casual", musicType: "Pop, Commercial, Party hits",
    description: "Lively pub with great food, drink specials and a fun party atmosphere.",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9359815b6b5c?w=800&q=80",
    goodFor: ["Groups", "Budget nights", "Pub lovers"],
    notIdealFor: ["Quiet evenings", "Couples"],
    recommendedReason: "Cold beer, good pub food, and a crowd that's actually having fun. Solid every time.",
  },
  {
    id: "roosevelt-lounge",
    name: "Roosevelt Lounge",
    suburb: "Broadbeach",
    lat: -28.029, lng: 153.433,
    vibes: ["Date Night", "Chill Drinks"],
    priceLevel: 3, crowdLevel: "Medium",
    bestArrivalTime: "7pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Smart", musicType: "Smooth jazz, soul, ambient",
    description: "Sleek cocktail lounge inspired by the golden era of travel. Craft cocktails, intimate lighting.",
    imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80",
    goodFor: ["Couples", "Special occasions", "Cocktail lovers"],
    notIdealFor: ["Budget nights", "Big groups", "Late nights"],
    recommendedReason: "Broadbeach's most refined cocktail experience. Worth every dollar for the right night.",
  },
  {
    id: "kurrawa-beach-club",
    name: "Kurrawa Beach Club",
    suburb: "Broadbeach",
    lat: -28.034, lng: 153.435,
    vibes: ["Big Night", "Chill Drinks"],
    priceLevel: 2, crowdLevel: "High",
    bestArrivalTime: "6pm", bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Beach casual", musicType: "DJ sets, tropical house",
    description: "Beachfront club right on Kurrawa Beach. Sunset sessions roll into a big night seamlessly.",
    imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    goodFor: ["Beach lovers", "Sundowners", "Big groups"],
    notIdealFor: ["Rainy days", "Quiet evenings"],
    recommendedReason: "Sunset sessions on the sand, then a proper party. Best of both worlds.",
  },

  // ── BURLEIGH ──────────────────────────────────────────────────────────────
  {
    id: "burleigh-pavilion",
    name: "Burleigh Pavilion",
    suburb: "Burleigh",
    lat: -28.082, lng: 153.455,
    vibes: ["Chill Drinks", "Date Night"],
    priceLevel: 2, crowdLevel: "Medium",
    bestArrivalTime: "6pm", bestNights: ["Thursday", "Friday", "Saturday", "Sunday"],
    dressCode: "Casual smart", musicType: "Laid back, indie, acoustic",
    description: "Iconic clifftop bar overlooking Burleigh Beach. One of the most beautiful spots on the GC.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    goodFor: ["Couples", "Catch-ups", "Sundowners"],
    notIdealFor: ["Clubbing", "Late nights"],
    recommendedReason: "Arguably the best view on the Gold Coast. Go for sundowners and stay for dinner.",
  },
  {
    id: "justin-lane",
    name: "Justin Lane",
    suburb: "Burleigh",
    lat: -28.085, lng: 153.454,
    vibes: ["Date Night", "Food First"],
    priceLevel: 2, crowdLevel: "Medium",
    bestArrivalTime: "7pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Smart casual", musicType: "Ambient, indie",
    description: "Rooftop pizza bar and cocktail lounge in the heart of Burleigh.",
    imageUrl: "https://images.unsplash.com/photo-1559524071-1fdcf9f98b88?w=800&q=80",
    goodFor: ["Couples", "Foodies", "Rooftop lovers"],
    notIdealFor: ["Big groups", "Night owls"],
    recommendedReason: "Best rooftop in Burleigh. The pizza is legit and the cocktail list is long.",
  },
  {
    id: "burleigh-hotel",
    name: "Burleigh Hotel",
    suburb: "Burleigh",
    lat: -28.087, lng: 153.453,
    vibes: ["Big Night", "Live Music"],
    priceLevel: 1, crowdLevel: "High",
    bestArrivalTime: "8pm", bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Casual", musicType: "Live bands, DJ sets, classic rock",
    description: "A classic Gold Coast pub with live entertainment and cold beers. Always buzzing on weekends.",
    imageUrl: "https://images.unsplash.com/photo-1566827010894-00e2b0a6d73a?w=800&q=80",
    goodFor: ["Pub lovers", "Live music fans", "Budget nights"],
    notIdealFor: ["Quiet evenings", "Fine dining"],
    recommendedReason: "Burleigh's most reliable big night. Live music, cheap drinks, good people.",
  },
  {
    id: "pink-monkey",
    name: "Pink Monkey",
    suburb: "Burleigh",
    lat: -28.084, lng: 153.454,
    vibes: ["Chill Drinks", "Date Night"],
    priceLevel: 2, crowdLevel: "Medium",
    bestArrivalTime: "7pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Smart casual", musicType: "Lo-fi, tropical, chill",
    description: "Eclectic bar with a playful aesthetic, great natural wines, and killer snacks.",
    imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
    goodFor: ["Date nights", "Natural wine lovers", "Small groups"],
    notIdealFor: ["Big rowdy groups", "Beer drinkers"],
    recommendedReason: "Burleigh's most charming bar. Come for the wine, stay for the vibes.",
  },
  {
    id: "lockwood-bar",
    name: "Lockwood Bar",
    suburb: "Burleigh",
    lat: -28.086, lng: 153.452,
    vibes: ["Chill Drinks", "Date Night"],
    priceLevel: 2, crowdLevel: "Low",
    bestArrivalTime: "6pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Casual", musicType: "Dark jazz, soul, lo-fi",
    description: "Intimate basement-style cocktail bar. Dark, moody, and excellent drinks.",
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
    goodFor: ["Cocktail lovers", "Quiet nights", "Couples"],
    notIdealFor: ["Big groups", "Party starters"],
    recommendedReason: "The GC's best-kept secret. Small, dark, and seriously good cocktails.",
  },

  // ── MIAMI ─────────────────────────────────────────────────────────────────
  {
    id: "miami-marketta",
    name: "Miami Marketta",
    suburb: "Miami",
    lat: -28.067, lng: 153.443,
    vibes: ["Live Music", "Food First"],
    priceLevel: 1, crowdLevel: "Medium",
    bestArrivalTime: "6pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Casual", musicType: "Live bands, acoustic sets, eclectic",
    description: "GC's favourite street food market with live music, craft beers and heaps of food stalls.",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    goodFor: ["Families", "Groups", "Foodies", "Music lovers"],
    notIdealFor: ["Clubbers", "Late night crowd"],
    recommendedReason: "Best value night out on the GC. Great food, live music, zero pretense.",
  },
  {
    id: "granddad-jacks",
    name: "Granddad Jack's Distillery",
    suburb: "Miami",
    lat: -28.065, lng: 153.442,
    vibes: ["Chill Drinks", "Date Night"],
    priceLevel: 2, crowdLevel: "Low",
    bestArrivalTime: "5pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Casual smart", musicType: "Jazz, soul, acoustic",
    description: "Craft gin distillery bar with tours, tastings and inventive cocktails. Relaxed and genuinely cool.",
    imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&q=80",
    goodFor: ["Gin lovers", "Couples", "Unique experiences"],
    notIdealFor: ["Non-drinkers", "Big nights", "Budget nights"],
    recommendedReason: "GC's best gin bar. Do the tasting flight, then order a cocktail. Completely worth it.",
  },
  {
    id: "the-henchman",
    name: "The Henchman",
    suburb: "Miami",
    lat: -28.068, lng: 153.444,
    vibes: ["Date Night", "Chill Drinks"],
    priceLevel: 2, crowdLevel: "Medium",
    bestArrivalTime: "6pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Smart casual", musicType: "Indie, folk, acoustic",
    description: "Neighbourhood wine bar with great share plates and a laid-back atmosphere.",
    imageUrl: "https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=800&q=80",
    goodFor: ["Wine lovers", "Date nights", "Small groups"],
    notIdealFor: ["Beer drinkers", "Late nights", "Big groups"],
    recommendedReason: "Miami's most underrated wine bar. Go early, eat well, stay long.",
  },
  {
    id: "elsewhere",
    name: "Elsewhere",
    suburb: "Miami",
    lat: -28.066, lng: 153.441,
    vibes: ["Food First", "Chill Drinks"],
    priceLevel: 2, crowdLevel: "Medium",
    bestArrivalTime: "6pm", bestNights: ["Wednesday", "Thursday", "Friday", "Saturday"],
    dressCode: "Casual", musicType: "Chill electronic, ambient, indie",
    description: "Modern bar and kitchen with a rotating menu and great drinks. The spot Miami needed.",
    imageUrl: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80",
    goodFor: ["Foodies", "Casual drinks", "Small groups"],
    notIdealFor: ["Big nights", "Clubbing"],
    recommendedReason: "Decent food, great drinks, no attitude. Miami's most reliable mid-week spot.",
  },

  // ── COOLANGATTA ───────────────────────────────────────────────────────────
  {
    id: "coolangatta-hotel",
    name: "Coolangatta Hotel",
    suburb: "Coolangatta",
    lat: -28.165, lng: 153.540,
    vibes: ["Live Music", "Big Night"],
    priceLevel: 1, crowdLevel: "High",
    bestArrivalTime: "8pm", bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Casual", musicType: "Live rock, cover bands, local artists",
    description: "Legendary live music pub at the southern end of the GC. Great local bands, good prices.",
    imageUrl: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&q=80",
    goodFor: ["Music lovers", "Locals", "Budget nights"],
    notIdealFor: ["Clubbers", "Fancy nights"],
    recommendedReason: "The most authentic pub on the GC. Live music every weekend and the cheapest drinks around.",
  },
];

const STORAGE_KEY = "tonightgc_venues";

export function getVenues(): Venue[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const customVenues: Venue[] = JSON.parse(stored);
      return [...SEED_VENUES, ...customVenues];
    }
  } catch {}
  return SEED_VENUES;
}

export function saveVenue(venue: Venue): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let custom: Venue[] = stored ? JSON.parse(stored) : [];
    const idx = custom.findIndex((v) => v.id === venue.id);
    if (idx >= 0) custom[idx] = venue;
    else custom.push(venue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } catch {}
}

export function deleteVenue(id: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const custom: Venue[] = JSON.parse(stored).filter((v: Venue) => v.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    }
  } catch {}
}

export function getVenueById(id: string): Venue | undefined {
  return getVenues().find((v) => v.id === id);
}

export const VIBES: VibeType[] = [
  "Big Night", "Chill Drinks", "Date Night", "Cheap Night", "Live Music", "Food First",
];

export const SUBURBS: SuburbType[] = [
  "Surfers Paradise", "Broadbeach", "Burleigh", "Miami", "Coolangatta",
];
