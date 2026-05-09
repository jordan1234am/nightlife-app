import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fapkqseinfpdbdbzptsb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhcGtxc2VpbmZwZGJkYnpwdHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjYyMzgsImV4cCI6MjA5Mzg0MjIzOH0.0RjBGxuSJJ772q514fQB5ttSiF8Rug6EJ3diGTY1OOw'
const supabase = createClient(supabaseUrl, supabaseKey)
// ============================
// VENUE DATA
// Core required fields: name, suburb, lat, lng, imageUrl,
// peakTime, closingTime, priceLevel, tags, activityScore
// ============================

export type VibeType = "Big Night" | "Chill Drinks" | "Date Night" | "Cheap Night" | "Live Music" | "Food First";
export type SuburbType = "Surfers Paradise" | "Broadbeach" | "Burleigh" | "Miami" | "Coolangatta";

export interface Venue {
  id: string;
  name: string;
  suburb: SuburbType;
  address?: string;        // short street address for the venue panel
  // ── Core heat-map fields ──────────────────────────────────────────────────
  lat?: number;
  lng?: number;
  imageUrl: string;
  peakTime: string;        // e.g. "11pm" — when the venue hits maximum energy
  closingTime: string;     // e.g. "3am"  — when the venue winds down
  priceLevel: 1 | 2 | 3;
  tags: string[];          // flexible descriptive tags
  activityScore: number;   // 0-100: venue's maximum energy level at peak
  // ── Legacy / extra detail fields ─────────────────────────────────────────
  vibes: VibeType[];
  crowdLevel: "Low" | "Medium" | "High";
  bestArrivalTime: string;
  bestNights: string[];
  dressCode: string;
  musicType: string;
  description: string;
  goodFor: string[];
  notIdealFor: string[];
  recommendedReason: string;
}

// ─── Tag presets ──────────────────────────────────────────────────────────────
export const VENUE_TAGS: string[] = [
  "Nightclub", "Bar", "Pub", "Lounge", "Rooftop", "Beachfront", "Outdoor",
  "Live Music", "DJs", "Dance Floor", "Cocktails", "Craft Spirits",
  "Natural Wine", "Beer Garden", "Street Food", "Food",
  "Late Night", "Early Evening", "Upscale", "Casual", "Student Friendly", "Intimate",
];

// ─── Time → slider step helper ────────────────────────────────────────────────
// Step 0 = 6pm, each step = 15 min, step 48 = 6am next day
export function parseTimeToStep(time: string): number {
  const match = time.toLowerCase().match(/^(\d{1,2})(am|pm)$/);
  if (!match) return 24; // default midnight
  let hour = parseInt(match[1]);
  const period = match[2];
  if (period === "am") { if (hour === 12) hour = 0; }
  else { if (hour !== 12) hour += 12; }
  let h = hour - 18;
  if (h < 0) h += 24;
  return Math.min(h * 4, 48);
}

function lerpClamped(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Per-venue time-based heat using the venue's own activityScore, peakTime, closingTime */
export function getVenueHeatAtStep(venue: Venue, timeStep: number): number {
  const score = venue.activityScore ?? 60;
  const peakStep = parseTimeToStep(venue.peakTime ?? "11pm");
  const closeStep = parseTimeToStep(venue.closingTime ?? "3am");
  const openStep = Math.max(0, peakStep - 8);   // 2-hour ramp to peak
  const preStep = Math.max(0, openStep - 4);    // 1-hour low before ramp

  if (timeStep >= closeStep) return Math.round(score * 0.04);
  if (timeStep >= peakStep) {
    const t = (timeStep - peakStep) / Math.max(1, closeStep - peakStep);
    return Math.round(lerpClamped(score, score * 0.04, t));
  }
  if (timeStep >= openStep) {
    const t = (timeStep - openStep) / Math.max(1, peakStep - openStep);
    return Math.round(lerpClamped(score * 0.25, score, t));
  }
  if (timeStep >= preStep) {
    const t = (timeStep - preStep) / Math.max(1, openStep - preStep);
    return Math.round(lerpClamped(score * 0.08, score * 0.25, t));
  }
  return Math.round(score * 0.08);
}

// ─── Seed venue IDs (for admin "isCustom" check) ─────────────────────────────
export const SEED_VENUE_IDS: string[] = [
  "surfers-pavilion", "cali-beach", "the-avenue", "sin-city", "bedroom-lounge-bar",
  "loose-moose", "roosevelt-lounge", "kurrawa-beach-club",
  "burleigh-pavilion", "justin-lane", "burleigh-hotel", "pink-monkey", "lockwood-bar",
  "miami-marketta", "granddad-jacks", "the-henchman", "elsewhere",
  "coolangatta-hotel",
];

// ─── Seed venues — real building coordinates ──────────────────────────────────
// TO EDIT COORDINATES: Google Maps → right-click the building → copy lat,lng
// Each venue has: lat: <decimal degrees>, lng: <decimal degrees>
// Negative lat = south (Gold Coast), positive lng = east (Australia east coast)
const SEED_VENUES: Venue[] = [

  // ── SURFERS PARADISE (Orchid Ave / Cavill Ave strip) ─────────────────────
  {
    id: "surfers-pavilion",
    name: "Surfers Pavilion",
    suburb: "Surfers Paradise",
    address: "Cavill Ave, Surfers Paradise",
    // Beachside end of Cavill Ave — on The Esplanade
    lat: -28.0034, lng: 153.4317,
    imageUrl: "https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=800&q=80",
    peakTime: "8pm", closingTime: "11pm",
    priceLevel: 2, activityScore: 58,
    tags: ["Beachfront", "Cocktails", "Bar", "Early Evening"],
    vibes: ["Chill Drinks", "Date Night"], crowdLevel: "Medium",
    bestArrivalTime: "7pm", bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Smart casual", musicType: "Acoustic, chill vibes",
    description: "Relaxed beachside bar with great cocktails and ocean views.",
    goodFor: ["Couples", "Small groups", "Sunset drinks"],
    notIdealFor: ["Big groups", "Late night clubbing"],
    recommendedReason: "Best sunset cocktails on the strip — book a table and let the ocean do the rest.",
  },
  {
    id: "cali-beach",
    name: "Cali Beach",
    suburb: "Surfers Paradise",
    address: "The Esplanade, Surfers Paradise",
    // Northern Esplanade beachfront
    lat: -28.0007, lng: 153.4309,
    imageUrl: "https://images.unsplash.com/photo-1571266028243-d220c6853fa9?w=800&q=80",
    peakTime: "12am", closingTime: "4am",
    priceLevel: 2, activityScore: 82,
    tags: ["Beachfront", "Nightclub", "Dance Floor", "DJs", "Late Night"],
    vibes: ["Big Night"], crowdLevel: "High",
    bestArrivalTime: "10pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Smart casual to dressy", musicType: "Commercial house, Top 40",
    description: "High-energy beachfront club with multiple bars and a pumping dancefloor.",
    goodFor: ["Groups", "Dancing", "Late nights"],
    notIdealFor: ["Quiet catch-ups", "Early evenings"],
    recommendedReason: "If you want to actually dance tonight, this is the move. Gets going properly around 11pm.",
  },
  {
    id: "the-avenue",
    name: "The Avenue",
    suburb: "Surfers Paradise",
    address: "9 Orchid Ave, Surfers Paradise",
    // 9 Orchid Ave — north end of the Orchid Ave nightclub strip
    lat: -28.0013, lng: 153.4282,
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    peakTime: "1am", closingTime: "5am",
    priceLevel: 3, activityScore: 92,
    tags: ["Nightclub", "Dance Floor", "DJs", "Upscale", "Late Night"],
    vibes: ["Big Night"], crowdLevel: "High",
    bestArrivalTime: "11pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Dressy", musicType: "R&B, Hip Hop, Commercial",
    description: "GC's premier nightclub. Multiple levels, VIP areas, big-name DJs.",
    goodFor: ["Big groups", "VIP experience", "Dancing"],
    notIdealFor: ["Budget nights", "Casual drinks"],
    recommendedReason: "The biggest club on the coast. Go late, go dressy, go hard.",
  },
  {
    id: "sin-city",
    name: "SinCity",
    suburb: "Surfers Paradise",
    address: "22 Orchid Ave, Surfers Paradise",
    // 22 Orchid Ave — mid-strip
    lat: -28.0020, lng: 153.4280,
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    peakTime: "12am", closingTime: "4am",
    priceLevel: 2, activityScore: 85,
    tags: ["Nightclub", "Dance Floor", "DJs", "Late Night"],
    vibes: ["Big Night"], crowdLevel: "High",
    bestArrivalTime: "11pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Dressy casual", musicType: "EDM, Commercial house",
    description: "Multi-room nightclub on the Orchid Ave strip. Huge dancefloor, multiple bars, always packed late.",
    goodFor: ["Groups", "Big nights", "Late finishers"],
    notIdealFor: ["Early nights", "Quiet drinks"],
    recommendedReason: "Orchid Ave's biggest party. Peak crowd after midnight — get in early or queue.",
  },
  {
    id: "bedroom-lounge-bar",
    name: "Bedroom Lounge Bar",
    suburb: "Surfers Paradise",
    address: "Orchid Ave, Surfers Paradise",
    // Orchid Ave south section
    lat: -28.0028, lng: 153.4278,
    imageUrl: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800&q=80",
    peakTime: "11pm", closingTime: "3am",
    priceLevel: 2, activityScore: 72,
    tags: ["Lounge", "DJs", "Late Night", "Bar"],
    vibes: ["Chill Drinks", "Big Night"], crowdLevel: "Medium",
    bestArrivalTime: "9pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Smart casual", musicType: "Lounge, RnB, commercial",
    description: "Relaxed lounge bar that heats up as the night progresses.",
    goodFor: ["Pre-drinks", "Mixed groups", "Night starters"],
    notIdealFor: ["Early dinners", "Family groups"],
    recommendedReason: "Perfect bridge between sunset drinks and the main event. Relaxed start, lively finish.",
  },

  // ── BROADBEACH ────────────────────────────────────────────────────────────
  {
    id: "loose-moose",
    name: "Loose Moose",
    suburb: "Broadbeach",
    address: "Surf Parade, Broadbeach",
    // Surf Parade — main Broadbeach dining/bar strip
    lat: -28.0275, lng: 153.4323,
    imageUrl: "https://images.unsplash.com/photo-1543007630-9359815b6b5c?w=800&q=80",
    peakTime: "9pm", closingTime: "1am",
    priceLevel: 1, activityScore: 70,
    tags: ["Pub", "Beer Garden", "Food", "Student Friendly"],
    vibes: ["Food First", "Big Night"], crowdLevel: "High",
    bestArrivalTime: "8pm", bestNights: ["Wednesday", "Thursday", "Friday", "Saturday"],
    dressCode: "Casual", musicType: "Pop, Commercial, Party hits",
    description: "Lively pub with great food, drink specials and a fun party atmosphere.",
    goodFor: ["Groups", "Budget nights", "Pub lovers"],
    notIdealFor: ["Quiet evenings", "Couples"],
    recommendedReason: "Cold beer, good pub food, and a crowd that's actually having fun. Solid every time.",
  },
  {
    id: "roosevelt-lounge",
    name: "Roosevelt Lounge",
    suburb: "Broadbeach",
    address: "Albert Ave, Broadbeach",
    // Albert Ave corner, Broadbeach
    lat: -28.0267, lng: 153.4309,
    imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80",
    peakTime: "9pm", closingTime: "1am",
    priceLevel: 3, activityScore: 62,
    tags: ["Cocktails", "Upscale", "Lounge", "Intimate"],
    vibes: ["Date Night", "Chill Drinks"], crowdLevel: "Medium",
    bestArrivalTime: "7pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Smart", musicType: "Smooth jazz, soul, ambient",
    description: "Sleek cocktail lounge inspired by the golden era of travel. Craft cocktails, intimate lighting.",
    goodFor: ["Couples", "Special occasions", "Cocktail lovers"],
    notIdealFor: ["Budget nights", "Big groups", "Late nights"],
    recommendedReason: "Broadbeach's most refined cocktail experience. Worth every dollar for the right night.",
  },
  {
    id: "kurrawa-beach-club",
    name: "Kurrawa Beach Club",
    suburb: "Broadbeach",
    address: "Kurrawa Esplanade, Broadbeach",
    // Kurrawa Beach, southern Broadbeach beachfront
    lat: -28.0342, lng: 153.4344,
    imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    peakTime: "8pm", closingTime: "12am",
    priceLevel: 2, activityScore: 68,
    tags: ["Beachfront", "DJs", "Outdoor", "Early Evening"],
    vibes: ["Big Night", "Chill Drinks"], crowdLevel: "High",
    bestArrivalTime: "6pm", bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Beach casual", musicType: "DJ sets, tropical house",
    description: "Beachfront club right on Kurrawa Beach. Sunset sessions roll into a big night seamlessly.",
    goodFor: ["Beach lovers", "Sundowners", "Big groups"],
    notIdealFor: ["Rainy days", "Quiet evenings"],
    recommendedReason: "Sunset sessions on the sand, then a proper party. Best of both worlds.",
  },

  // ── BURLEIGH HEADS (James St / Goodwin Tce) ───────────────────────────────
  {
    id: "burleigh-pavilion",
    name: "Burleigh Pavilion",
    suburb: "Burleigh",
    address: "43 Goodwin Tce, Burleigh Heads",
    // 43 Goodwin Tce — clifftop on Burleigh Heads headland (user-verified)
    lat: -28.0843, lng: 153.4550,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    peakTime: "7pm", closingTime: "10pm",
    priceLevel: 2, activityScore: 60,
    tags: ["Rooftop", "Beachfront", "Cocktails", "Sunset", "Bar"],
    vibes: ["Chill Drinks", "Date Night"], crowdLevel: "Medium",
    bestArrivalTime: "6pm", bestNights: ["Thursday", "Friday", "Saturday", "Sunday"],
    dressCode: "Casual smart", musicType: "Laid back, indie, acoustic",
    description: "Iconic clifftop bar overlooking Burleigh Beach. One of the most beautiful spots on the GC.",
    goodFor: ["Couples", "Catch-ups", "Sundowners"],
    notIdealFor: ["Clubbing", "Late nights"],
    recommendedReason: "Arguably the best view on the Gold Coast. Go for sundowners and stay for dinner.",
  },
  {
    id: "justin-lane",
    name: "Justin Lane",
    suburb: "Burleigh",
    address: "50 James St, Burleigh Heads",
    // 50 James St — James St rooftop strip, northern end
    lat: -28.0826, lng: 153.4538,
    imageUrl: "https://images.unsplash.com/photo-1559524071-1fdcf9f98b88?w=800&q=80",
    peakTime: "8pm", closingTime: "11pm",
    priceLevel: 2, activityScore: 65,
    tags: ["Rooftop", "Food", "Cocktails", "Bar"],
    vibes: ["Date Night", "Food First"], crowdLevel: "Medium",
    bestArrivalTime: "7pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Smart casual", musicType: "Ambient, indie",
    description: "Rooftop pizza bar and cocktail lounge in the heart of Burleigh.",
    goodFor: ["Couples", "Foodies", "Rooftop lovers"],
    notIdealFor: ["Big groups", "Night owls"],
    recommendedReason: "Best rooftop in Burleigh. The pizza is legit and the cocktail list is long.",
  },
  {
    id: "burleigh-hotel",
    name: "Burleigh Hotel",
    suburb: "Burleigh",
    address: "2 Gold Coast Hwy, Burleigh Heads",
    // Corner of Gold Coast Hwy & James St — landmark heritage pub
    lat: -28.0862, lng: 153.4523,
    imageUrl: "https://images.unsplash.com/photo-1566827010894-00e2b0a6d73a?w=800&q=80",
    peakTime: "10pm", closingTime: "2am",
    priceLevel: 1, activityScore: 75,
    tags: ["Pub", "Live Music", "Beer Garden"],
    vibes: ["Big Night", "Live Music"], crowdLevel: "High",
    bestArrivalTime: "8pm", bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Casual", musicType: "Live bands, DJ sets, classic rock",
    description: "A classic Gold Coast pub with live entertainment and cold beers. Always buzzing on weekends.",
    goodFor: ["Pub lovers", "Live music fans", "Budget nights"],
    notIdealFor: ["Quiet evenings", "Fine dining"],
    recommendedReason: "Burleigh's most reliable big night. Live music, cheap drinks, good people.",
  },
  {
    id: "pink-monkey",
    name: "Pink Monkey",
    suburb: "Burleigh",
    address: "66 James St, Burleigh Heads",
    // 66 James St — mid-James St strip
    lat: -28.0828, lng: 153.4543,
    imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
    peakTime: "8pm", closingTime: "11pm",
    priceLevel: 2, activityScore: 60,
    tags: ["Bar", "Natural Wine", "Casual", "Intimate"],
    vibes: ["Chill Drinks", "Date Night"], crowdLevel: "Medium",
    bestArrivalTime: "7pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Smart casual", musicType: "Lo-fi, tropical, chill",
    description: "Eclectic bar with a playful aesthetic, great natural wines, and killer snacks.",
    goodFor: ["Date nights", "Natural wine lovers", "Small groups"],
    notIdealFor: ["Big rowdy groups", "Beer drinkers"],
    recommendedReason: "Burleigh's most charming bar. Come for the wine, stay for the vibes.",
  },
  {
    id: "lockwood-bar",
    name: "Lockwood Bar",
    suburb: "Burleigh",
    address: "James St, Burleigh Heads",
    // James St cocktail bar
    lat: -28.0831, lng: 153.4540,
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
    peakTime: "9pm", closingTime: "1am",
    priceLevel: 2, activityScore: 58,
    tags: ["Cocktails", "Bar", "Intimate"],
    vibes: ["Chill Drinks", "Date Night"], crowdLevel: "Low",
    bestArrivalTime: "6pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Casual", musicType: "Dark jazz, soul, lo-fi",
    description: "Intimate basement-style cocktail bar. Dark, moody, and excellent drinks.",
    goodFor: ["Cocktail lovers", "Quiet nights", "Couples"],
    notIdealFor: ["Big groups", "Party starters"],
    recommendedReason: "The GC's best-kept secret. Small, dark, and seriously good cocktails.",
  },

  // ── MIAMI (Vernon St / Pacific Ave) ──────────────────────────────────────
  {
    id: "miami-marketta",
    name: "Miami Marketta",
    suburb: "Miami",
    address: "23 Vernon St, Miami",
    // 23 Vernon St — industrial warehouse precinct
    lat: -28.0673, lng: 153.4437,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    peakTime: "8pm", closingTime: "10pm",
    priceLevel: 1, activityScore: 60,
    tags: ["Street Food", "Live Music", "Outdoor", "Casual", "Food"],
    vibes: ["Live Music", "Food First"], crowdLevel: "Medium",
    bestArrivalTime: "6pm", bestNights: ["Friday", "Saturday"],
    dressCode: "Casual", musicType: "Live bands, acoustic sets, eclectic",
    description: "GC's favourite street food market with live music, craft beers and heaps of food stalls.",
    goodFor: ["Families", "Groups", "Foodies", "Music lovers"],
    notIdealFor: ["Clubbers", "Late night crowd"],
    recommendedReason: "Best value night out on the GC. Great food, live music, zero pretense.",
  },
  {
    id: "granddad-jacks",
    name: "Granddad Jack's Distillery",
    suburb: "Miami",
    address: "2 Swim Lane, Miami One",
    // 2 Swim Lane — Miami One precinct, just north of Vernon St
    lat: -28.0661, lng: 153.4428,
    imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&q=80",
    peakTime: "7pm", closingTime: "10pm",
    priceLevel: 2, activityScore: 52,
    tags: ["Craft Spirits", "Cocktails", "Bar", "Intimate"],
    vibes: ["Chill Drinks", "Date Night"], crowdLevel: "Low",
    bestArrivalTime: "5pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Casual smart", musicType: "Jazz, soul, acoustic",
    description: "Craft gin distillery bar with tours, tastings and inventive cocktails. Relaxed and genuinely cool.",
    goodFor: ["Gin lovers", "Couples", "Unique experiences"],
    notIdealFor: ["Non-drinkers", "Big nights", "Budget nights"],
    recommendedReason: "GC's best gin bar. Do the tasting flight, then order a cocktail. Completely worth it.",
  },
  {
    id: "the-henchman",
    name: "The Henchman",
    suburb: "Miami",
    address: "18 Pacific Ave, Miami",
    // 18 Pacific Ave — beachside strip
    lat: -28.0679, lng: 153.4445,
    imageUrl: "https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=800&q=80",
    peakTime: "8pm", closingTime: "11pm",
    priceLevel: 2, activityScore: 55,
    tags: ["Natural Wine", "Bar", "Food", "Casual"],
    vibes: ["Date Night", "Chill Drinks"], crowdLevel: "Medium",
    bestArrivalTime: "6pm", bestNights: ["Thursday", "Friday", "Saturday"],
    dressCode: "Smart casual", musicType: "Indie, folk, acoustic",
    description: "Neighbourhood wine bar with great share plates and a laid-back atmosphere.",
    goodFor: ["Wine lovers", "Date nights", "Small groups"],
    notIdealFor: ["Beer drinkers", "Late nights", "Big groups"],
    recommendedReason: "Miami's most underrated wine bar. Go early, eat well, stay long.",
  },
  {
    id: "elsewhere",
    name: "Elsewhere",
    suburb: "Miami",
    address: "Pacific Ave, Miami",
    // Pacific Ave, Miami — near Vernon St intersection
    lat: -28.0668, lng: 153.4434,
    imageUrl: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80",
    peakTime: "8pm", closingTime: "11pm",
    priceLevel: 2, activityScore: 55,
    tags: ["Food", "Bar", "Casual", "Outdoor"],
    vibes: ["Food First", "Chill Drinks"], crowdLevel: "Medium",
    bestArrivalTime: "6pm", bestNights: ["Wednesday", "Thursday", "Friday", "Saturday"],
    dressCode: "Casual", musicType: "Chill electronic, ambient, indie",
    description: "Modern bar and kitchen with a rotating menu and great drinks. The spot Miami needed.",
    goodFor: ["Foodies", "Casual drinks", "Small groups"],
    notIdealFor: ["Big nights", "Clubbing"],
    recommendedReason: "Decent food, great drinks, no attitude. Miami's most reliable mid-week spot.",
  },

  // ── COOLANGATTA ───────────────────────────────────────────────────────────
  {
    id: "coolangatta-hotel",
    name: "Coolangatta Hotel",
    suburb: "Coolangatta",
    address: "2 Marine Pde, Coolangatta",
    // 2 Marine Pde — corner building on the Coolangatta beachfront
    lat: -28.1654, lng: 153.5404,
    imageUrl: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&q=80",
    peakTime: "10pm", closingTime: "2am",
    priceLevel: 1, activityScore: 72,
    tags: ["Pub", "Live Music", "Beer Garden"],
    vibes: ["Live Music", "Big Night"], crowdLevel: "High",
    bestArrivalTime: "8pm", bestNights: ["Friday", "Saturday", "Sunday"],
    dressCode: "Casual", musicType: "Live rock, cover bands, local artists",
    description: "Legendary live music pub at the southern end of the GC.",
    goodFor: ["Music lovers", "Locals", "Budget nights"],
    notIdealFor: ["Clubbers", "Fancy nights"],
    recommendedReason: "The most authentic pub on the GC. Live music every weekend and the cheapest drinks around.",
  },
];

// ─── CRUD helpers ─────────────────────────────────────────────────────────────
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
