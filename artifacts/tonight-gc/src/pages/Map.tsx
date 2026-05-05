import { useState, useEffect, useCallback, Fragment } from "react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Flame, Music, DollarSign } from "lucide-react";
import { getVenues, SUBURBS, SuburbType, VibeType, Venue } from "@/data/venues";
import {
  GC_CENTER, GC_ZOOM, formatTimeStep, getHeatAtStep, heatToColor, heatToRadius,
  SUBURB_COORDS, TIME_STEP_MIN, TIME_STEP_MAX, DEFAULT_TIME_STEP,
} from "@/data/mapData";
import {
  getVenueInteraction, getUserVote, setVenueStatus, setVibeTag,
  getHotspotLevel, VIBE_VOTE_TAGS,
  VenueInteraction, UserVote, VibeVoteTag,
} from "@/data/interactions";
import { cn } from "@/lib/utils";

// ─── Circles inside MapContainer ─────────────────────────────────────────────
function MapCircles({
  timeStep,
  selectedSuburb,
  onSuburbClick,
}: {
  timeStep: number;
  selectedSuburb: SuburbType | null;
  onSuburbClick: (suburb: SuburbType) => void;
}) {
  return (
    <>
      {SUBURBS.map((suburb) => {
        const heat = getHeatAtStep(suburb, timeStep);
        const color = heatToColor(heat);
        const baseRadius = heatToRadius(heat);
        const coords = SUBURB_COORDS[suburb];
        const isSelected = suburb === selectedSuburb;
        const opacity = isSelected ? 1.2 : 1;

        return (
          <Fragment key={suburb}>
            {/* Outer glow */}
            <Circle
              center={coords}
              radius={baseRadius * 3.2}
              pathOptions={{ color: "transparent", fillColor: color, fillOpacity: 0.06 * opacity, weight: 0 }}
              eventHandlers={{ click: () => onSuburbClick(suburb) }}
            />
            {/* Mid glow */}
            <Circle
              center={coords}
              radius={baseRadius * 1.8}
              pathOptions={{ color: "transparent", fillColor: color, fillOpacity: 0.14 * opacity, weight: 0 }}
              eventHandlers={{ click: () => onSuburbClick(suburb) }}
            />
            {/* Core */}
            <Circle
              center={coords}
              radius={baseRadius * 0.55}
              pathOptions={{
                color: isSelected ? "#ffffff" : color,
                fillColor: color,
                fillOpacity: 0.82,
                weight: isSelected ? 2.5 : 0,
              }}
              eventHandlers={{ click: () => onSuburbClick(suburb) }}
            />
          </Fragment>
        );
      })}
    </>
  );
}

// ─── Venue card in the suburb sheet ──────────────────────────────────────────
function VenueCard({
  venue,
  selectedVibe,
  onTap,
}: {
  venue: Venue;
  selectedVibe: VibeType | null;
  onTap: (venue: Venue) => void;
}) {
  const interaction = getVenueInteraction(venue.id);
  const hotspot = getHotspotLevel(interaction);
  const priceStr = "$".repeat(venue.priceLevel);
  const flameCount = venue.crowdLevel === "High" ? 3 : venue.crowdLevel === "Medium" ? 2 : 1;

  const hotspotColor =
    hotspot === "Hotspot" ? "#ff4433" :
    hotspot === "Busy"    ? "#e040fb" :
    hotspot === "Building"? "#7c3aed" : "#3730a3";

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onTap(venue)}
      className="relative shrink-0 w-40 h-52 rounded-2xl overflow-hidden text-left"
      data-testid={`venue-card-${venue.id}`}
    >
      {/* Image background */}
      {venue.imageUrl ? (
        <img
          src={venue.imageUrl}
          alt={venue.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-800" />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      {/* Hotspot badge */}
      <div
        className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: `${hotspotColor}33`, color: hotspotColor, border: `1px solid ${hotspotColor}55` }}
      >
        {hotspot}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-display font-bold text-sm leading-tight mb-2">{venue.name}</p>

        {/* Flame crowd indicator */}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: flameCount }).map((_, i) => (
            <Flame key={i} className="h-3.5 w-3.5 text-orange-400 fill-orange-400/60" />
          ))}
          {Array.from({ length: 3 - flameCount }).map((_, i) => (
            <Flame key={i} className="h-3.5 w-3.5 text-white/20" />
          ))}
        </div>

        {/* Icon stats */}
        <div className="flex items-center gap-2 text-white/60 text-[11px]">
          <span className="flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" />{priceStr}
          </span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-0.5">
            <Music className="h-3 w-3" />
            <span className="truncate max-w-[60px]">{venue.musicType.split(",")[0]}</span>
          </span>
        </div>

        {/* Here now count */}
        <div className="flex items-center gap-1 mt-1.5 text-[11px]">
          <Users className="h-3 w-3 text-violet-400" />
          <span className="text-violet-300 font-semibold">{interaction.hereNow}</span>
          <span className="text-white/40">here</span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Interaction sheet (2-step) ───────────────────────────────────────────────
function InteractionSheet({
  venue,
  onClose,
}: {
  venue: Venue;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [interaction, setInteraction] = useState<VenueInteraction>(() => getVenueInteraction(venue.id));
  const [vote, setVote] = useState<UserVote>(() => getUserVote(venue.id));

  const handleStatus = (status: "going" | "here" | null) => {
    const result = setVenueStatus(venue.id, status);
    setInteraction(result.interaction);
    setVote(result.vote);
    if (status === null) {
      // "Left" — just close
      onClose();
    } else {
      setStep(2);
    }
  };

  const handleVibeTag = (tag: VibeVoteTag) => {
    const result = setVibeTag(venue.id, tag);
    setInteraction(result.interaction);
    setVote(result.vote);
    setTimeout(onClose, 300);
  };

  const VIBE_LABELS: Record<VibeVoteTag, string> = {
    "Busy": "Busy",
    "Mid": "Mid",
    "Dead": "Dead",
    "Good Music": "Good Music",
    "Expensive": "Pricey",
  };

  const VIBE_COLORS: Record<VibeVoteTag, string> = {
    "Busy": "#e040fb",
    "Mid": "#7c3aed",
    "Dead": "#3730a3",
    "Good Music": "#06b6d4",
    "Expensive": "#f59e0b",
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 350 }}
      className="absolute bottom-0 left-0 right-0 z-[1200] bg-zinc-950 border-t border-zinc-800 rounded-t-3xl overflow-hidden"
      data-testid="interaction-sheet"
    >
      {/* Image header */}
      <div className="relative h-36 overflow-hidden">
        {venue.imageUrl && (
          <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70"
          data-testid="btn-close-interaction"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-3 left-4">
          <h3 className="text-white font-display font-bold text-lg">{venue.name}</h3>
          <p className="text-zinc-400 text-xs">{venue.suburb}</p>
        </div>
      </div>

      <div className="px-4 pb-8 pt-4">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-zinc-300 text-sm font-semibold mb-3 text-center">You here?</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatus("here")}
                  className={cn(
                    "py-3.5 rounded-2xl text-sm font-bold border transition-all",
                    vote.status === "here"
                      ? "bg-pink-600 border-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                      : "bg-zinc-900 border-zinc-700 text-zinc-300"
                  )}
                  data-testid="btn-here-now"
                >
                  Here Now
                </button>
                <button
                  onClick={() => handleStatus("going")}
                  className={cn(
                    "py-3.5 rounded-2xl text-sm font-bold border transition-all",
                    vote.status === "going"
                      ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                      : "bg-zinc-900 border-zinc-700 text-zinc-300"
                  )}
                  data-testid="btn-going"
                >
                  Going
                </button>
                <button
                  onClick={() => handleStatus(null)}
                  className="py-3.5 rounded-2xl text-sm font-bold border border-zinc-700 bg-zinc-900 text-zinc-400"
                  data-testid="btn-left"
                >
                  Left
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-zinc-300 text-sm font-semibold mb-3 text-center">What's the vibe?</p>
              <div className="grid grid-cols-3 gap-2">
                {VIBE_VOTE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleVibeTag(tag)}
                    className={cn(
                      "py-3 rounded-2xl text-xs font-bold border transition-all",
                      vote.vibeTag === tag
                        ? "text-white"
                        : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    )}
                    style={
                      vote.vibeTag === tag
                        ? { background: `${VIBE_COLORS[tag]}33`, borderColor: `${VIBE_COLORS[tag]}88`, color: VIBE_COLORS[tag] }
                        : {}
                    }
                    data-testid={`btn-vibe-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {VIBE_LABELS[tag]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Suburb bottom sheet ──────────────────────────────────────────────────────
function SuburbSheet({
  suburb,
  timeStep,
  selectedVibe,
  onClose,
  onVenueTap,
}: {
  suburb: SuburbType;
  timeStep: number;
  selectedVibe: VibeType | null;
  onClose: () => void;
  onVenueTap: (venue: Venue) => void;
}) {
  const allVenues = getVenues();
  const suburbVenues = allVenues.filter((v) => v.suburb === suburb);
  const heat = getHeatAtStep(suburb, timeStep);
  const heatColor = heatToColor(heat);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 350 }}
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.3 }}
      onDragEnd={(_e, info) => { if (info.offset.y > 80) onClose(); }}
      className="absolute bottom-0 left-0 right-0 z-[1100] bg-zinc-950/98 backdrop-blur-xl border-t border-zinc-800/80 rounded-t-3xl"
      data-testid="suburb-sheet"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 rounded-full bg-zinc-700" />
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white font-display font-bold text-xl">{suburb}</h2>
            <p className="text-zinc-500 text-xs">{suburbVenues.length} spots · {formatTimeStep(timeStep)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"
            data-testid="btn-close-suburb"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Heat bar */}
        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              key={`${suburb}-${timeStep}`}
              initial={{ width: 0 }}
              animate={{ width: `${heat}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, #7c3aed, ${heatColor})` }}
            />
          </div>
        </div>
      </div>

      {/* Horizontal venue cards */}
      <div className="px-4 pb-6 overflow-x-auto flex gap-3 no-scrollbar">
        {suburbVenues.length === 0 ? (
          <p className="text-zinc-600 text-sm py-4">No venues listed here yet.</p>
        ) : (
          suburbVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} selectedVibe={selectedVibe} onTap={onVenueTap} />
          ))
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Map page ────────────────────────────────────────────────────────────
export default function Map() {
  const [, setLocation] = useLocation();
  const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(null);
  const [timeStep, setTimeStep] = useState(DEFAULT_TIME_STEP);
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbType | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("tonightgc_vibe") as VibeType;
    if (saved) setSelectedVibe(saved);
  }, []);

  const handleSuburbClick = useCallback((suburb: SuburbType) => {
    setSelectedVenue(null);
    setSelectedSuburb((prev) => (prev === suburb ? null : suburb));
  }, []);

  const handleVenueTap = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
  }, []);

  const handleCloseSuburb = useCallback(() => {
    setSelectedSuburb(null);
    setSelectedVenue(null);
  }, []);

  const handleCloseInteraction = useCallback(() => {
    setSelectedVenue(null);
  }, []);

  // Slider fill %
  const sliderFill = ((timeStep - TIME_STEP_MIN) / (TIME_STEP_MAX - TIME_STEP_MIN)) * 100;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0d0e1a]">
      {/* ─── Leaflet map (full screen) ─────────────────────────────────────── */}
      <MapContainer
        center={GC_CENTER}
        zoom={GC_ZOOM}
        zoomControl={false}
        attributionControl={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 10 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <MapCircles
          timeStep={timeStep}
          selectedSuburb={selectedSuburb}
          onSuburbClick={handleSuburbClick}
        />
      </MapContainer>

      {/* ─── Top overlay ───────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-5 flex items-center justify-between pointer-events-none">
        <button
          className="pointer-events-auto font-display font-black text-white text-lg drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]"
          onClick={() => setLocation("/")}
          data-testid="btn-home-logo"
        >
          Tonight <span className="text-violet-400">GC</span>
        </button>

        {selectedVibe && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setLocation("/")}
            className="pointer-events-auto flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 px-3 py-1.5 rounded-full"
            data-testid="btn-change-vibe"
          >
            <span className="text-violet-300 text-xs font-semibold">{selectedVibe}</span>
            <X className="h-3 w-3 text-zinc-500" />
          </motion.button>
        )}
      </div>

      {/* ─── Time slider (bottom, always visible) ──────────────────────────── */}
      <AnimatePresence>
        {!selectedSuburb && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-[1000] px-5 pb-10 pt-4 bg-gradient-to-t from-black/80 to-transparent"
          >
            <div className="text-center mb-3">
              <span className="text-white text-2xl font-display font-black tracking-tight drop-shadow-[0_0_16px_rgba(168,85,247,0.5)]">
                {formatTimeStep(timeStep)}
              </span>
              <p className="text-zinc-500 text-xs mt-0.5">Drag to change the time</p>
            </div>
            <input
              type="range"
              min={TIME_STEP_MIN}
              max={TIME_STEP_MAX}
              step={1}
              value={timeStep}
              onChange={(e) => setTimeStep(Number(e.target.value))}
              className="time-slider"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${sliderFill}%, rgba(255,255,255,0.1) ${sliderFill}%, rgba(255,255,255,0.1) 100%)`,
              }}
              data-testid="time-slider"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-medium">
              <span>6pm</span>
              <span>10pm</span>
              <span>2am</span>
              <span>6am</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Suburb sheet ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedSuburb && !selectedVenue && (
          <SuburbSheet
            key={selectedSuburb}
            suburb={selectedSuburb}
            timeStep={timeStep}
            selectedVibe={selectedVibe}
            onClose={handleCloseSuburb}
            onVenueTap={handleVenueTap}
          />
        )}
      </AnimatePresence>

      {/* ─── Interaction sheet ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedVenue && (
          <InteractionSheet
            key={selectedVenue.id}
            venue={selectedVenue}
            onClose={handleCloseInteraction}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
