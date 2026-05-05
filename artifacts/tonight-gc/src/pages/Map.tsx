import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { getVenues, SUBURBS, SuburbType, VibeType } from "@/data/venues";
import {
  getVenueInteraction,
  getUserVote,
  toggleStatus,
  toggleVibeTag,
  toggleSocialTag,
  getHotspotLevel,
  getDominantSocialTag,
  VIBE_VOTE_TAGS,
  SOCIAL_TAGS,
  VenueInteraction,
  UserVote,
  VibeVoteTag,
  SocialTag,
} from "@/data/interactions";
import { TIME_SLOTS, TimeSlot, getHeatLevel, heatToColor, SUBURB_POSITIONS } from "@/data/mapData";
import { cn } from "@/lib/utils";
import { X, Users, Flame, ChevronLeft } from "lucide-react";

// ─── Hotspot badge styling ────────────────────────────────────────────────────
function hotspotStyle(level: string) {
  if (level === "Hotspot") return "bg-pink-600/30 text-pink-300 border-pink-500/50";
  if (level === "Busy") return "bg-violet-600/30 text-violet-300 border-violet-500/50";
  if (level === "Building") return "bg-indigo-600/30 text-indigo-300 border-indigo-500/50";
  return "bg-zinc-700/40 text-zinc-400 border-zinc-600/40";
}

// ─── Venue card with interactions ────────────────────────────────────────────
function MapVenueCard({ venue, selectedVibe }: { venue: ReturnType<typeof getVenues>[0]; selectedVibe: VibeType | null }) {
  const [interaction, setInteraction] = useState<VenueInteraction>(() => getVenueInteraction(venue.id));
  const [vote, setVote] = useState<UserVote>(() => getUserVote(venue.id));

  const hotspot = getHotspotLevel(interaction);
  const socialTag = getDominantSocialTag(interaction);

  const handleStatus = (status: "going" | "here") => {
    const result = toggleStatus(venue.id, status);
    setInteraction(result.interaction);
    setVote(result.vote);
  };

  const handleVibeTag = (tag: VibeVoteTag) => {
    const result = toggleVibeTag(venue.id, tag);
    setInteraction(result.interaction);
    setVote(result.vote);
  };

  const handleSocialTag = (tag: SocialTag) => {
    const result = toggleSocialTag(venue.id, tag);
    setInteraction(result.interaction);
    setVote(result.vote);
  };

  const priceStr = "$".repeat(venue.priceLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3"
      data-testid={`map-venue-card-${venue.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-white text-base leading-tight truncate">{venue.name}</h3>
          <p className="text-zinc-500 text-xs mt-0.5">{venue.suburb} · {priceStr} · {venue.crowdLevel} crowd</p>
        </div>
        <span className={cn("shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full border", hotspotStyle(hotspot))}>
          {hotspot === "Hotspot" ? "Hotspot" : hotspot}
        </span>
      </div>

      {/* Vibe tags */}
      <div className="flex flex-wrap gap-1.5">
        {venue.vibes.map((v) => (
          <span
            key={v}
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full border font-medium",
              selectedVibe === v
                ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-400"
            )}
          >
            {v}
          </span>
        ))}
      </div>

      {/* People stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
          <Users className="h-3.5 w-3.5 text-violet-400" />
          <span><span className="text-white font-semibold">{interaction.peopleGoing}</span> going</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
          <Flame className="h-3.5 w-3.5 text-pink-400" />
          <span><span className="text-white font-semibold">{interaction.hereNow}</span> here now</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleStatus("going")}
          className={cn(
            "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
            vote.status === "going"
              ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.4)]"
              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-violet-500/50 hover:text-white"
          )}
          data-testid={`btn-going-${venue.id}`}
        >
          Going
        </button>
        <button
          onClick={() => handleStatus("here")}
          className={cn(
            "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
            vote.status === "here"
              ? "bg-pink-600 border-pink-500 text-white shadow-[0_0_16px_rgba(236,72,153,0.4)]"
              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-pink-500/50 hover:text-white"
          )}
          data-testid={`btn-here-${venue.id}`}
        >
          Here Now
        </button>
      </div>

      {/* Vibe vote tags */}
      <div>
        <p className="text-zinc-600 text-[11px] uppercase tracking-wider mb-1.5 font-medium">Vibe</p>
        <div className="flex flex-wrap gap-1.5">
          {VIBE_VOTE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleVibeTag(tag)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium",
                vote.vibeTag === tag
                  ? "bg-violet-600/40 border-violet-400/60 text-violet-200"
                  : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              )}
              data-testid={`btn-vibe-${venue.id}-${tag.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tag} {interaction.vibeVotes[tag] > 0 && <span className="opacity-60 ml-0.5">{interaction.vibeVotes[tag]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Social openness */}
      <div>
        <p className="text-zinc-600 text-[11px] uppercase tracking-wider mb-1.5 font-medium">Social vibe</p>
        <div className="flex gap-1.5">
          {SOCIAL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleSocialTag(tag)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium flex-1 text-center",
                vote.socialTag === tag
                  ? "bg-indigo-600/40 border-indigo-400/60 text-indigo-200"
                  : socialTag === tag
                    ? "bg-zinc-700/60 border-zinc-600 text-zinc-300"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              )}
              data-testid={`btn-social-${venue.id}-${tag.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Simulated coastal map ────────────────────────────────────────────────────
function CoastalMap({
  time,
  selectedSuburb,
  onSelectSuburb,
  selectedVibe,
}: {
  time: TimeSlot;
  selectedSuburb: SuburbType | null;
  onSelectSuburb: (suburb: SuburbType | null) => void;
  selectedVibe: VibeType | null;
}) {
  return (
    <div className="relative w-full" style={{ paddingBottom: "130%" }}>
      {/* Ocean background */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-[#090d1a]">
        {/* Subtle ocean texture */}
        <div className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(15,30,80,0.8) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 80% 50%, rgba(5,10,40,0.6) 0%, transparent 80%)"
          }}
        />
        {/* Coastline shape */}
        <svg viewBox="0 0 100 130" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Ocean */}
          <rect width="100" height="130" fill="transparent" />
          {/* Land mass */}
          <path
            d="M0,0 L42,0 L44,10 L46,22 L50,38 L54,55 L58,72 L62,90 L65,108 L67,130 L0,130 Z"
            fill="rgba(20,22,35,0.95)"
          />
          {/* Coastline glow */}
          <path
            d="M42,0 L44,10 L46,22 L50,38 L54,55 L58,72 L62,90 L65,108 L67,130"
            fill="none"
            stroke="rgba(100,120,200,0.2)"
            strokeWidth="0.8"
          />
          {/* Beach strip */}
          <path
            d="M42,0 L44,10 L46,22 L50,38 L54,55 L58,72 L62,90 L65,108 L67,130 L70,130 L68,108 L66,90 L63,72 L59,55 L55,38 L48,22 L47,10 L45,0 Z"
            fill="rgba(180,150,80,0.06)"
          />
          {/* "Pacific Ocean" label */}
          <text x="78" y="65" fill="rgba(80,120,200,0.25)" fontSize="4.5" fontFamily="sans-serif" textAnchor="middle" transform="rotate(90, 78, 65)">
            PACIFIC OCEAN
          </text>
        </svg>

        {/* Suburb nodes */}
        {SUBURBS.map((suburb) => {
          const pos = SUBURB_POSITIONS[suburb];
          const heat = getHeatLevel(suburb, time);
          const rgb = heatToColor(heat);
          const isSelected = selectedSuburb === suburb;
          const size = isSelected ? 9 : 7;
          const glowSize = heat > 60 ? 28 : heat > 40 ? 20 : 14;

          return (
            <button
              key={suburb}
              onClick={() => onSelectSuburb(isSelected ? null : suburb)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              data-testid={`map-suburb-${suburb.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {/* Heat glow ring */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute rounded-full"
                style={{
                  width: glowSize * 2,
                  height: glowSize * 2,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, rgba(${rgb},0.35) 0%, rgba(${rgb},0.08) 60%, transparent 100%)`,
                }}
              />
              {/* Node dot */}
              <motion.div
                animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className="relative rounded-full border-2 shadow-lg"
                style={{
                  width: size * 4,
                  height: size * 4,
                  background: `rgba(${rgb}, 0.9)`,
                  borderColor: isSelected ? `rgba(${rgb},1)` : `rgba(${rgb},0.6)`,
                  boxShadow: `0 0 ${isSelected ? 20 : 10}px rgba(${rgb},0.6)`,
                }}
              />
              {/* Label */}
              <div
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 top-full mt-1.5 whitespace-nowrap text-[10px] font-bold tracking-wide pointer-events-none",
                  isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                )}
                style={{ textShadow: `0 0 8px rgba(${rgb},0.8)` }}
              >
                {pos.label}
              </div>
              {/* Heat % badge */}
              <div
                className="absolute -top-2 -right-2 text-[9px] font-bold px-1 rounded-full border"
                style={{
                  background: `rgba(${rgb},0.25)`,
                  borderColor: `rgba(${rgb},0.5)`,
                  color: `rgb(${rgb})`,
                }}
              >
                {heat}%
              </div>
            </button>
          );
        })}
      </div>

      {/* Map legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.8)]" />
          <span className="text-[9px] text-zinc-500 font-medium">Hotspot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
          <span className="text-[9px] text-zinc-500 font-medium">Busy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_4px_rgba(79,70,229,0.6)]" />
          <span className="text-[9px] text-zinc-500 font-medium">Quiet</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Map page ────────────────────────────────────────────────────────────
export default function Map() {
  const [, setLocation] = useLocation();
  const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot>("10pm");
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbType | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("tonightgc_vibe") as VibeType;
    if (saved) setSelectedVibe(saved);
  }, []);

  const allVenues = getVenues();
  const suburbVenues = selectedSuburb
    ? allVenues.filter((v) => v.suburb === selectedSuburb)
    : [];

  const filteredVenues = selectedVibe
    ? suburbVenues.filter((v) => v.vibes.includes(selectedVibe))
    : suburbVenues;

  const displayVenues = filteredVenues.length > 0 ? filteredVenues : suburbVenues;

  return (
    <div className="min-h-[100dvh] bg-[#08090f] pb-24 md:pb-0 pt-0 md:pt-16 overflow-x-hidden">
      <NavBar />

      <div className="max-w-md md:max-w-5xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-black text-white text-2xl leading-tight">
              Energy Map
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {selectedVibe ? (
                <>Showing <span className="text-violet-400 font-medium">{selectedVibe}</span> spots</>
              ) : (
                "Tap an area to see what's on"
              )}
            </p>
          </div>
          {selectedVibe && (
            <button
              onClick={() => setLocation("/")}
              className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
              data-testid="btn-change-vibe"
            >
              Change vibe
            </button>
          )}
        </div>

        {/* Time slider */}
        <div className="mb-5">
          <p className="text-zinc-600 text-[11px] uppercase tracking-wider mb-2 font-medium">Time</p>
          <div className="grid grid-cols-4 gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={cn(
                  "py-2 rounded-lg text-sm font-semibold transition-all",
                  selectedTime === t
                    ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
                data-testid={`btn-time-${t}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Map + panel layout */}
        <div className="md:grid md:grid-cols-5 md:gap-6">
          {/* Map */}
          <div className="md:col-span-3">
            <CoastalMap
              time={selectedTime}
              selectedSuburb={selectedSuburb}
              onSelectSuburb={setSelectedSuburb}
              selectedVibe={selectedVibe}
            />
          </div>

          {/* Venue panel */}
          <div className="md:col-span-2 mt-4 md:mt-0">
            <AnimatePresence mode="wait">
              {selectedSuburb ? (
                <motion.div
                  key={selectedSuburb}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Suburb header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="font-display font-bold text-white text-lg">{selectedSuburb}</h2>
                      <p className="text-zinc-500 text-xs">
                        {displayVenues.length} venue{displayVenues.length !== 1 ? "s" : ""}{" "}
                        {filteredVenues.length < suburbVenues.length && selectedVibe
                          ? `matching ${selectedVibe}`
                          : "tonight"}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedSuburb(null)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                      data-testid="btn-close-suburb"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Heat meter */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span>Area energy at {selectedTime}</span>
                      <span className="font-semibold" style={{ color: `rgb(${heatToColor(getHeatLevel(selectedSuburb, selectedTime))})` }}>
                        {getHeatLevel(selectedSuburb, selectedTime)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div
                        key={`${selectedSuburb}-${selectedTime}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${getHeatLevel(selectedSuburb, selectedTime)}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(to right, rgba(139,92,246,0.8), rgb(${heatToColor(getHeatLevel(selectedSuburb, selectedTime))}))`
                        }}
                      />
                    </div>
                  </div>

                  {/* Venue cards */}
                  <div className="space-y-3 max-h-[60vh] md:max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
                    <AnimatePresence>
                      {displayVenues.map((venue) => (
                        <MapVenueCard key={venue.id} venue={venue} selectedVibe={selectedVibe} />
                      ))}
                    </AnimatePresence>
                    {displayVenues.length === 0 && (
                      <div className="text-center py-8 text-zinc-600 text-sm">
                        No venues in {selectedSuburb} yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-48 md:h-80 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                    <Flame className="h-5 w-5 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 text-sm">Tap an area on the map<br />to see what's happening</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
