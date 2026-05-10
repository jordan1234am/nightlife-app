import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Venue, SuburbType, VibeType, getVenues } from "@/data/venues";

const KNOWN_VIBES: VibeType[] = [
  "Big Night", "Chill Drinks", "Date Night", "Cheap Night", "Live Music", "Food First",
];
const CROWD_LEVELS = ["Low", "Medium", "High"] as const;

function toVibes(raw: string[] | undefined): VibeType[] {
  if (!raw || raw.length === 0) return ["Big Night"];
  const filtered = raw.filter((v): v is VibeType => KNOWN_VIBES.includes(v as VibeType));
  return filtered.length > 0 ? filtered : ["Big Night"];
}

function toCrowdLevel(raw: string | undefined): "Low" | "Medium" | "High" {
  if (CROWD_LEVELS.includes(raw as "Low" | "Medium" | "High")) return raw as "Low" | "Medium" | "High";
  return "Medium";
}

// ─── Suburb normaliser ────────────────────────────────────────────────────────
const KNOWN_SUBURBS: SuburbType[] = [
  "Surfers Paradise", "Broadbeach", "Burleigh", "Miami", "Coolangatta",
];

function normaliseSuburb(raw: string | null | undefined): SuburbType {
  const s = (raw ?? "").trim();
  const exact = KNOWN_SUBURBS.find((k) => k.toLowerCase() === s.toLowerCase());
  if (exact) return exact;
  if (/surfers/i.test(s)) return "Surfers Paradise";
  if (/broadbeach/i.test(s)) return "Broadbeach";
  if (/burleigh/i.test(s)) return "Burleigh";
  if (/miami/i.test(s)) return "Miami";
  if (/coolangatta|cooly/i.test(s)) return "Coolangatta";
  return "Surfers Paradise";
}

// ─── Supabase row shape ───────────────────────────────────────────────────────
interface VenueRow {
  id: string | number;
  name: string;
  suburb?: string;
  address?: string;
  latitude?: number | string;
  lat?: number | string;
  longitude?: number | string;
  lng?: number | string;
  image_url?: string;
  peak_time?: string;
  closing_time?: string;
  price_level?: number;
  activity_score?: number;
  tags?: string[];
  category?: string;
  vibes?: string[];
  crowd_level?: string;
  best_arrival_time?: string;
  best_nights?: string[];
  dress_code?: string;
  music_type?: string;
  description?: string;
  good_for?: string[];
  not_ideal_for?: string[];
  recommended_reason?: string;
}

// ─── Row → Venue mapper ───────────────────────────────────────────────────────
function rowToVenue(row: VenueRow): Venue | null {
  const lat = Number(row.latitude ?? row.lat);
  const lng = Number(row.longitude ?? row.lng);
  if (!row.name || Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return {
    id: `db-${row.id}`,
    name: row.name,
    suburb: normaliseSuburb(row.suburb),
    address: row.address ?? undefined,
    lat,
    lng,
    imageUrl:
      row.image_url ??
      "https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=800&q=80",
    peakTime: row.peak_time ?? "10pm",
    closingTime: row.closing_time ?? "2am",
    priceLevel: ([1, 2, 3].includes(row.price_level ?? 2) ? row.price_level ?? 2 : 2) as 1 | 2 | 3,
    activityScore: row.activity_score ?? 65,
    tags: row.tags ?? (row.category ? [row.category] : ["Bar"]),
    vibes: toVibes(row.vibes),
    crowdLevel: toCrowdLevel(row.crowd_level),
    bestArrivalTime: row.best_arrival_time ?? "9pm",
    bestNights: row.best_nights ?? ["Friday", "Saturday"],
    dressCode: row.dress_code ?? "Casual",
    musicType: row.music_type ?? "DJ Sets",
    description: row.description ?? `${row.name} in ${row.suburb ?? "Gold Coast"}`,
    goodFor: row.good_for ?? ["Groups"],
    notIdealFor: row.not_ideal_for ?? [],
    recommendedReason: row.recommended_reason ?? "Popular Gold Coast venue",
  };
}

// ─── Module-level cache — persists across navigations ────────────────────────
let venueCache: Venue[] | null = null;
let fetchPromise: Promise<Venue[]> | null = null;

async function loadFromSupabase(): Promise<Venue[]> {
  if (venueCache) return venueCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const { data, error } = await supabase.from("venues").select("*");
      if (error) {
        console.warn("[useVenues] Supabase query error:", error.message, error);
        return getVenues();
      }
      if (!data || data.length === 0) {
        console.warn(
          "[useVenues] Supabase returned 0 rows — check Row Level Security policy on the `venues` table. " +
          "Add a policy: ALTER TABLE venues ENABLE ROW LEVEL SECURITY; " +
          "CREATE POLICY \"public read\" ON venues FOR SELECT USING (true);"
        );
        return getVenues();
      }
      const venues = data.map(rowToVenue).filter((v): v is Venue => v !== null);
      if (venues.length === 0) return getVenues();
      venueCache = venues;
      console.info(`[useVenues] Loaded ${venues.length} venues from Supabase`);
      return venues;
    } catch (err) {
      console.warn("[useVenues] Supabase error, using seed data:", err);
      return getVenues();
    }
  })();

  return fetchPromise;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>(() => venueCache ?? getVenues());
  const [loading, setLoading] = useState(!venueCache);

  useEffect(() => {
    if (venueCache) {
      setVenues(venueCache);
      setLoading(false);
      return;
    }
    loadFromSupabase().then((v) => {
      setVenues(v);
      setLoading(false);
    });
  }, []);

  return { venues, loading };
}
