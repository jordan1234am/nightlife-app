import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Flame, Music, DollarSign } from "lucide-react";
import L from "leaflet";
import { getVenues, SUBURBS, SuburbType, VibeType, Venue } from "@/data/venues";
import {
  GC_CENTER, GC_ZOOM, formatTimeStep, getHeatAtStep,
  SUBURB_COORDS, TIME_STEP_MIN, TIME_STEP_MAX, DEFAULT_TIME_STEP,
} from "@/data/mapData";
import {
  getVenueInteraction, getUserVote, setVenueStatus, setVibeTag,
  getHotspotLevel, VIBE_VOTE_TAGS,
  VenueInteraction, UserVote, VibeVoteTag,
} from "@/data/interactions";
import { cn } from "@/lib/utils";

// ─── Thermal color helpers ────────────────────────────────────────────────────
function heatToRGB(heat: number): [number, number, number] {
  if (heat >= 80) return [255, 80, 0];    // bright orange-red
  if (heat >= 60) return [220, 20, 150];  // vivid magenta
  if (heat >= 40) return [130, 0, 255];   // vivid violet
  if (heat >= 20) return [50, 20, 240];   // bright blue-violet
  return [15, 20, 200];                   // deep blue
}

function coreRGB(heat: number): [number, number, number] {
  if (heat >= 80) return [255, 220, 60];  // hot yellow-white
  if (heat >= 60) return [255, 120, 220]; // hot pink
  if (heat >= 40) return [200, 80, 255];  // bright violet
  return [80, 60, 255];                   // bright blue
}

function heatToHex(heat: number): string {
  const [r, g, b] = heatToRGB(heat);
  return `rgb(${Math.min(255, Math.round(r * 2.2))},${Math.min(255, Math.round(g * 2.2))},${Math.min(255, Math.round(b * 2.2))})`;
}

// ─── Canvas heat layer (inside a custom Leaflet pane) ────────────────────────
// Key insight: by placing the canvas in a Leaflet pane (z-index 280 — between
// tile pane 200 and overlay pane 400), it lives in the same stacking context as
// all other Leaflet panes. Drawing uses latLngToLayerPoint() so that Leaflet's
// CSS pane-transform handles panning automatically — we only redraw on zoom.
function HeatLayer({ venues, timeStep }: { venues: Venue[]; timeStep: number }) {
  const map = useMap();

  useEffect(() => {
    // Create dedicated heat pane between tiles(200) and overlays(400)
    if (!map.getPane("heatPane")) {
      map.createPane("heatPane").style.zIndex = "280";
    }
    const heatPane = map.getPane("heatPane")!;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.filter = "blur(36px) saturate(1.6) brightness(1.05)";
    heatPane.appendChild(canvas);

    function draw() {
      const nw = map.getBounds().getNorthWest();
      const se = map.getBounds().getSouthEast();
      const topLeft = map.latLngToLayerPoint(nw);
      const bottomRight = map.latLngToLayerPoint(se);

      // Padding so blur doesn't clip at edges
      const pad = 120;
      const x0 = topLeft.x - pad;
      const y0 = topLeft.y - pad;
      const w = bottomRight.x - topLeft.x + pad * 2;
      const h = bottomRight.y - topLeft.y + pad * 2;

      canvas.width = w;
      canvas.height = h;
      canvas.style.left = `${x0}px`;
      canvas.style.top = `${y0}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter"; // additive — nearby venues pool heat

      const zoom = map.getZoom();
      const lat = map.getCenter().lat;
      const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

      for (const venue of venues) {
        if (venue.lat == null || venue.lng == null) continue;
        const heat = getHeatAtStep(venue.suburb, timeStep);
        if (heat < 6) continue;

        // Layer point: fixed in Leaflet's pixel space, pane transform handles pan
        const lp = map.latLngToLayerPoint([venue.lat, venue.lng]);
        const cx = lp.x - x0;
        const cy = lp.y - y0;

        const rPx = (220 + (heat / 100) * 520) / mpp;
        const [r, g, b] = heatToRGB(heat);
        const alpha = 0.5 + (heat / 100) * 0.45;

        // Outer diffuse glow
        const outer = ctx.createRadialGradient(cx, cy, 0, cx, cy, rPx);
        outer.addColorStop(0,    `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
        outer.addColorStop(0.35, `rgba(${r},${g},${b},${(alpha * 0.55).toFixed(3)})`);
        outer.addColorStop(0.7,  `rgba(${r},${g},${b},${(alpha * 0.18).toFixed(3)})`);
        outer.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
        ctx.fill();

        // Bright hot core
        if (heat >= 30) {
          const coreR = rPx * 0.3;
          const [cr, cg, cb] = coreRGB(heat);
          const ca = Math.min(0.99, alpha * 1.6);
          const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
          core.addColorStop(0,   `rgba(${cr},${cg},${cb},${ca.toFixed(3)})`);
          core.addColorStop(0.45, `rgba(${cr},${cg},${cb},${(ca * 0.4).toFixed(3)})`);
          core.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
          ctx.fillStyle = core;
          ctx.beginPath();
          ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    draw();
    // Only redraw on zoom (panning is handled by Leaflet's CSS transform on the pane)
    map.on("zoomend moveend", draw);

    return () => {
      map.off("zoomend moveend", draw);
      if (heatPane.contains(canvas)) heatPane.removeChild(canvas);
    };
  }, [map, venues, timeStep]);

  return null;
}

// ─── Venue pin markers (custom pane above overlay pane) ───────────────────────
function VenuePane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("venuePane")) {
      map.createPane("venuePane").style.zIndex = "620";
    }
  }, [map]);
  return null;
}

function VenuePins({
  venues, timeStep, onVenueTap,
}: {
  venues: Venue[]; timeStep: number; onVenueTap: (v: Venue) => void;
}) {
  return (
    <>
      {venues.map((venue) => {
        if (venue.lat == null || venue.lng == null) return null;
        const heat = getHeatAtStep(venue.suburb, timeStep);
        const fillColor = heatToHex(heat);
        return (
          <CircleMarker
            key={venue.id}
            center={[venue.lat, venue.lng]}
            radius={5}
            pane="venuePane"
            pathOptions={{
              fillColor,
              fillOpacity: 1,
              color: "rgba(255,255,255,0.75)",
              weight: 1.5,
            }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                onVenueTap(venue);
              },
            }}
          />
        );
      })}
    </>
  );
}

// ─── Map background click → nearest suburb ────────────────────────────────────
function MapClickHandler({ onSuburbSelect }: { onSuburbSelect: (s: SuburbType) => void }) {
  useMapEvents({
    click(e) {
      let closest: SuburbType | null = null;
      let minDist = Infinity;
      for (const suburb of SUBURBS) {
        const d = e.latlng.distanceTo(L.latLng(SUBURB_COORDS[suburb]));
        if (d < minDist) { minDist = d; closest = suburb; }
      }
      if (closest && minDist < 4500) onSuburbSelect(closest);
    },
  });
  return null;
}

// ─── Venue card ────────────────────────────────────────────────────────────────
function VenueCard({ venue, onTap }: { venue: Venue; onTap: (v: Venue) => void }) {
  const interaction = getVenueInteraction(venue.id);
  const hotspot = getHotspotLevel(interaction);
  const priceStr = "$".repeat(venue.priceLevel);
  const flameCount = venue.crowdLevel === "High" ? 3 : venue.crowdLevel === "Medium" ? 2 : 1;
  const heat = getHeatAtStep(venue.suburb, DEFAULT_TIME_STEP);
  const pinColor = heatToHex(heat);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onTap(venue)}
      className="relative shrink-0 w-40 h-52 rounded-2xl overflow-hidden text-left"
      data-testid={`venue-card-${venue.id}`}
    >
      {venue.imageUrl ? (
        <img src={venue.imageUrl} alt={venue.name}
          className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 bg-zinc-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-black/5" />

      <div className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
        style={{ background: `${pinColor}22`, borderColor: pinColor, color: pinColor }}>
        {hotspot}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-display font-bold text-sm leading-tight mb-1.5">{venue.name}</p>
        <div className="flex items-center gap-0.5 mb-2">
          {Array.from({ length: flameCount }).map((_, i) => (
            <Flame key={i} className="h-3.5 w-3.5 text-orange-400 fill-orange-400/60" />
          ))}
          {Array.from({ length: 3 - flameCount }).map((_, i) => (
            <Flame key={`e${i}`} className="h-3.5 w-3.5 text-white/15" />
          ))}
        </div>
        <div className="flex items-center gap-2 text-white/55 text-[11px]">
          <span className="flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" />{priceStr}
          </span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-0.5">
            <Music className="h-3 w-3" />
            <span className="truncate max-w-[60px]">{venue.musicType.split(",")[0]}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px]">
          <Users className="h-3 w-3" style={{ color: pinColor }} />
          <span className="font-semibold" style={{ color: pinColor }}>{interaction.hereNow}</span>
          <span className="text-white/35">here</span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Interaction sheet (2-step: status → vibe tag) ────────────────────────────
function InteractionSheet({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [vote, setVote] = useState<UserVote>(() => getUserVote(venue.id));
  const heat = getHeatAtStep(venue.suburb, DEFAULT_TIME_STEP);
  const pinColor = heatToHex(heat);

  const VIBE_LABELS: Record<VibeVoteTag, string> = {
    Busy: "Busy", Mid: "Mid", Dead: "Dead", "Good Music": "Music", Expensive: "Pricey",
  };

  const handleStatus = (status: "going" | "here" | null) => {
    const result = setVenueStatus(venue.id, status);
    setVote(result.vote);
    if (status === null) onClose();
    else setStep(2);
  };

  const handleVibeTag = (tag: VibeVoteTag) => {
    setVote(setVibeTag(venue.id, tag).vote);
    setTimeout(onClose, 250);
  };

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 360 }}
      className="absolute bottom-0 left-0 right-0 z-[1200] bg-zinc-950 rounded-t-3xl overflow-hidden border-t border-zinc-800"
      data-testid="interaction-sheet"
    >
      <div className="relative h-32 overflow-hidden">
        {venue.imageUrl && (
          <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        <button onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
          data-testid="btn-close-interaction">
          <X className="h-3.5 w-3.5 text-white/70" />
        </button>
        <div className="absolute bottom-2.5 left-4">
          <h3 className="text-white font-display font-bold text-base">{venue.name}</h3>
          <p className="text-xs" style={{ color: pinColor }}>{venue.suburb}</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-center mb-3">You here?</p>
              <div className="grid grid-cols-3 gap-2">
                {(["here", "going", null] as const).map((s, i) => {
                  const labels = ["Here Now", "Going", "Left"];
                  const isActive = vote.status === s;
                  return (
                    <button key={i} onClick={() => handleStatus(s)}
                      className={cn("py-3.5 rounded-2xl text-sm font-bold border transition-all",
                        isActive ? "text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300")}
                      style={isActive ? { background: `${pinColor}33`, borderColor: pinColor, color: pinColor } : {}}
                      data-testid={`btn-status-${labels[i].toLowerCase().replace(/\s/g, "-")}`}>
                      {labels[i]}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-center mb-3">What's the vibe?</p>
              <div className="grid grid-cols-3 gap-2">
                {VIBE_VOTE_TAGS.map((tag) => (
                  <button key={tag} onClick={() => handleVibeTag(tag)}
                    className={cn("py-3 rounded-2xl text-xs font-bold border transition-all",
                      vote.vibeTag === tag ? "text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300")}
                    style={vote.vibeTag === tag ? { background: `${pinColor}33`, borderColor: pinColor, color: pinColor } : {}}
                    data-testid={`btn-vibe-${tag.toLowerCase().replace(/\s/g, "-")}`}>
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

// ─── Suburb sheet ─────────────────────────────────────────────────────────────
function SuburbSheet({
  suburb, timeStep, onClose, onVenueTap,
}: {
  suburb: SuburbType; timeStep: number; onClose: () => void; onVenueTap: (v: Venue) => void;
}) {
  const allVenues = getVenues();
  const suburbVenues = allVenues.filter((v) => v.suburb === suburb);
  const heat = getHeatAtStep(suburb, timeStep);
  const heatColor = heatToHex(heat);

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 360 }}
      drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0, bottom: 0.25 }}
      onDragEnd={(_e, i) => { if (i.offset.y > 80) onClose(); }}
      className="absolute bottom-0 left-0 right-0 z-[1100] bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/60 rounded-t-3xl"
      data-testid="suburb-sheet"
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-zinc-700" />
      </div>
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white font-display font-bold text-xl">{suburb}</h2>
            <p className="text-zinc-500 text-xs">{suburbVenues.length} venues · {formatTimeStep(timeStep)}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"
            data-testid="btn-close-suburb">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden mb-3">
          <motion.div
            key={`${suburb}-${timeStep}`}
            initial={{ width: 0 }} animate={{ width: `${heat}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, #7c3aed, ${heatColor})` }}
          />
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-6 no-scrollbar">
        {suburbVenues.length === 0 ? (
          <p className="text-zinc-600 text-sm py-4">No venues here yet.</p>
        ) : (
          suburbVenues.map((v) => (
            <VenueCard key={v.id} venue={v} onTap={onVenueTap} />
          ))
        )}
      </div>
    </motion.div>
  );
}

// ─── Map page ─────────────────────────────────────────────────────────────────
export default function Map() {
  const [, setLocation] = useLocation();
  const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(null);
  const [timeStep, setTimeStep] = useState(DEFAULT_TIME_STEP);
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbType | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const allVenues = getVenues();

  useEffect(() => {
    const saved = sessionStorage.getItem("tonightgc_vibe") as VibeType;
    if (saved) setSelectedVibe(saved);
  }, []);

  const handleSuburbSelect = useCallback((suburb: SuburbType) => {
    setSelectedVenue(null);
    setSelectedSuburb(suburb);
  }, []);

  const handleVenueTap = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
  }, []);

  const sliderFill = ((timeStep - TIME_STEP_MIN) / (TIME_STEP_MAX - TIME_STEP_MIN)) * 100;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0d0e1a]">
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
        {/* Thermal canvas heat layer — inside Leaflet pane z-index 280 */}
        <HeatLayer venues={allVenues} timeStep={timeStep} />
        {/* Venue pin custom pane + circle markers */}
        <VenuePane />
        <VenuePins venues={allVenues} timeStep={timeStep} onVenueTap={handleVenueTap} />
        {/* Tap background to select suburb */}
        <MapClickHandler onSuburbSelect={handleSuburbSelect} />
      </MapContainer>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-5 flex items-center justify-between pointer-events-none">
        <button
          className="pointer-events-auto font-display font-black text-white text-lg"
          onClick={() => setLocation("/")}
          data-testid="btn-home-logo"
          style={{ textShadow: "0 0 20px rgba(168,85,247,0.5)" }}
        >
          Tonight <span className="text-violet-400">GC</span>
        </button>

        {selectedVibe && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setLocation("/")}
            className="pointer-events-auto flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 px-3 py-1.5 rounded-full"
            data-testid="btn-change-vibe"
          >
            <span className="text-violet-300 text-xs font-semibold">{selectedVibe}</span>
            <X className="h-3 w-3 text-zinc-500" />
          </motion.button>
        )}
      </div>

      {/* Time slider */}
      <AnimatePresence>
        {!selectedSuburb && !selectedVenue && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="absolute bottom-0 left-0 right-0 z-[1000] px-5 pb-10 pt-5 bg-gradient-to-t from-black/80 to-transparent"
          >
            <div className="text-center mb-3">
              <span className="text-white text-3xl font-display font-black tracking-tight"
                style={{ textShadow: "0 0 20px rgba(168,85,247,0.6)" }}>
                {formatTimeStep(timeStep)}
              </span>
            </div>
            <input type="range"
              min={TIME_STEP_MIN} max={TIME_STEP_MAX} step={1}
              value={timeStep}
              onChange={(e) => setTimeStep(Number(e.target.value))}
              className="time-slider"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #ec4899 ${sliderFill}%, rgba(255,255,255,0.08) ${sliderFill}%, rgba(255,255,255,0.08) 100%)`,
              }}
              data-testid="time-slider"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-medium">
              <span>6pm</span><span>10pm</span><span>2am</span><span>6am</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suburb sheet */}
      <AnimatePresence>
        {selectedSuburb && !selectedVenue && (
          <SuburbSheet
            key={selectedSuburb}
            suburb={selectedSuburb}
            timeStep={timeStep}
            onClose={() => { setSelectedSuburb(null); setSelectedVenue(null); }}
            onVenueTap={handleVenueTap}
          />
        )}
      </AnimatePresence>

      {/* Venue interaction sheet */}
      <AnimatePresence>
        {selectedVenue && (
          <InteractionSheet
            key={selectedVenue.id}
            venue={selectedVenue}
            onClose={() => setSelectedVenue(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
