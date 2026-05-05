import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, DollarSign, Clock, Users, MapPin } from "lucide-react";
import L from "leaflet";
import { getVenues, getVenueHeatAtStep, SUBURBS, SuburbType, Venue, VibeType } from "@/data/venues";
import {
  GC_CENTER, GC_ZOOM, formatTimeStep, getHeatAtStep,
  SUBURB_COORDS, TIME_STEP_MIN, TIME_STEP_MAX, DEFAULT_TIME_STEP,
} from "@/data/mapData";
import {
  getVenueInteraction, getUserVote, setVenueStatus, setVibeTag,
  VIBE_VOTE_TAGS, UserVote, VibeVoteTag,
} from "@/data/interactions";
import { cn } from "@/lib/utils";

// ─── Color helpers ────────────────────────────────────────────────────────────
function heatToRGB(heat: number): [number, number, number] {
  if (heat >= 80) return [255, 80, 0];
  if (heat >= 60) return [220, 20, 150];
  if (heat >= 40) return [130, 0, 255];
  if (heat >= 20) return [50, 20, 240];
  return [15, 20, 200];
}
function coreRGB(heat: number): [number, number, number] {
  if (heat >= 80) return [255, 220, 60];
  if (heat >= 60) return [255, 120, 220];
  if (heat >= 40) return [200, 80, 255];
  return [80, 60, 255];
}
function heatToHex(heat: number): string {
  const [r, g, b] = heatToRGB(heat);
  return `rgb(${Math.min(255, Math.round(r * 2.2))},${Math.min(255, Math.round(g * 2.2))},${Math.min(255, Math.round(b * 2.2))})`;
}

// ─── Street glow layer — subtle ambient energy around venues ──────────────────
// Drawn with source-over (not additive) at very low alpha, tiny radius (~10-20m).
// Gives the impression of people spilling onto streets / foot traffic.
function StreetGlowLayer({ venues, timeStep }: { venues: Venue[]; timeStep: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("streetPane")) {
      map.createPane("streetPane").style.zIndex = "270"; // below heat canvas
    }
    const pane = map.getPane("streetPane")!;
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.filter = "blur(4px)";
    pane.appendChild(canvas);

    function draw() {
      const nw = map.getBounds().getNorthWest();
      const se = map.getBounds().getSouthEast();
      const tl = map.latLngToLayerPoint(nw);
      const br = map.latLngToLayerPoint(se);
      const pad = 30;
      const x0 = tl.x - pad, y0 = tl.y - pad;
      const w = br.x - tl.x + pad * 2, h = br.y - tl.y + pad * 2;
      canvas.width = w; canvas.height = h;
      canvas.style.left = `${x0}px`; canvas.style.top = `${y0}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      const zoom = map.getZoom();
      const lat = map.getCenter().lat;
      const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

      for (const venue of venues) {
        if (!venue.lat || !venue.lng) continue;
        const heat = getVenueHeatAtStep(venue, timeStep);
        if (heat < 8) continue;
        const lp = map.latLngToLayerPoint([venue.lat, venue.lng]);
        const cx = lp.x - x0, cy = lp.y - y0;
        const rPx = Math.max(10, (12 + (heat / 100) * 18) / mpp); // 12-30m, min 10px
        const alpha = 0.06 + (heat / 100) * 0.09;   // very subtle
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rPx);
        g.addColorStop(0, `rgba(245,158,11,${alpha.toFixed(3)})`);  // amber
        g.addColorStop(1, "rgba(245,158,11,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, rPx, 0, Math.PI * 2); ctx.fill();
      }
    }

    draw();
    map.on("zoomend moveend", draw);
    return () => {
      map.off("zoomend moveend", draw);
      if (pane.contains(canvas)) pane.removeChild(canvas);
    };
  }, [map, venues, timeStep]);
  return null;
}

// ─── Thermal heat layer — venue-level blobs ───────────────────────────────────
// Tight blobs (40-120m radius) with additive blending so nearby venues pool.
// Blur is intentionally small (10px) so separate venues stay distinct.
function HeatLayer({ venues, timeStep }: { venues: Venue[]; timeStep: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("heatPane")) {
      map.createPane("heatPane").style.zIndex = "280";
    }
    const heatPane = map.getPane("heatPane")!;
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.filter = "blur(14px) saturate(1.9) brightness(1.1)";
    heatPane.appendChild(canvas);

    function draw() {
      const nw = map.getBounds().getNorthWest();
      const se = map.getBounds().getSouthEast();
      const tl = map.latLngToLayerPoint(nw);
      const br = map.latLngToLayerPoint(se);
      const pad = 60;
      const x0 = tl.x - pad, y0 = tl.y - pad;
      const w = br.x - tl.x + pad * 2, h = br.y - tl.y + pad * 2;
      canvas.width = w; canvas.height = h;
      canvas.style.left = `${x0}px`; canvas.style.top = `${y0}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const zoom = map.getZoom();
      const lat = map.getCenter().lat;
      const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

      for (const venue of venues) {
        if (!venue.lat || !venue.lng) continue;
        const heat = getVenueHeatAtStep(venue, timeStep);
        if (heat < 6) continue;

        const lp = map.latLngToLayerPoint([venue.lat, venue.lng]);
        const cx = lp.x - x0, cy = lp.y - y0;

        // Radius: meter-based (tighter at high zoom), minimum 22px so it's
        // always visible at the default zoom level (z12), stays distinct at z14+
        const rPx = Math.max(22, (55 + (heat / 100) * 110) / mpp);
        const [r, g, b] = heatToRGB(heat);
        const alpha = 0.45 + (heat / 100) * 0.5;

        const outer = ctx.createRadialGradient(cx, cy, 0, cx, cy, rPx);
        outer.addColorStop(0,    `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
        outer.addColorStop(0.4,  `rgba(${r},${g},${b},${(alpha * 0.5).toFixed(3)})`);
        outer.addColorStop(0.75, `rgba(${r},${g},${b},${(alpha * 0.12).toFixed(3)})`);
        outer.addColorStop(1,    "rgba(0,0,0,0)");
        ctx.fillStyle = outer;
        ctx.beginPath(); ctx.arc(cx, cy, rPx, 0, Math.PI * 2); ctx.fill();

        // Hot core only for high-heat venues
        if (heat >= 35) {
          const coreR = rPx * 0.28;
          const [cr, cg, cb] = coreRGB(heat);
          const ca = Math.min(0.99, alpha * 1.5);
          const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
          core.addColorStop(0,   `rgba(${cr},${cg},${cb},${ca.toFixed(3)})`);
          core.addColorStop(0.5, `rgba(${cr},${cg},${cb},${(ca * 0.3).toFixed(3)})`);
          core.addColorStop(1,   "rgba(0,0,0,0)");
          ctx.fillStyle = core;
          ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    draw();
    map.on("zoomend moveend", draw);
    return () => {
      map.off("zoomend moveend", draw);
      if (heatPane.contains(canvas)) heatPane.removeChild(canvas);
    };
  }, [map, venues, timeStep]);
  return null;
}

// ─── MacBook trackpad controls ────────────────────────────────────────────────
// On Mac: scroll wheel fires wheel events (ctrlKey=false = two-finger pan).
//         Pinch fires wheel events with ctrlKey=true.
// We intercept all wheel events, pan for swipe and zoom for pinch.
function TrackpadControls() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        // Pinch-to-zoom
        const delta = -e.deltaY * 0.008;
        map.setZoom(Math.max(10, Math.min(18, map.getZoom() + delta)), { animate: false });
      } else {
        // Two-finger swipe → pan
        map.panBy([e.deltaX * 1.4, e.deltaY * 1.4], { animate: false });
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [map]);
  return null;
}

// ─── Venue pane setup ─────────────────────────────────────────────────────────
function VenuePane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("venuePane")) {
      map.createPane("venuePane").style.zIndex = "620";
    }
  }, [map]);
  return null;
}

// ─── Venue pins ───────────────────────────────────────────────────────────────
function VenuePins({
  venues, timeStep, selectedId, onVenueTap,
}: {
  venues: Venue[]; timeStep: number; selectedId: string | null; onVenueTap: (v: Venue) => void;
}) {
  return (
    <>
      {venues.map((venue) => {
        if (!venue.lat || !venue.lng) return null;
        const heat = getVenueHeatAtStep(venue, timeStep);
        const fillColor = heatToHex(heat);
        const isSelected = venue.id === selectedId;

        return (
          <CircleMarker
            key={venue.id}
            center={[venue.lat, venue.lng]}
            radius={isSelected ? 8 : 5}
            pane="venuePane"
            pathOptions={{
              fillColor,
              fillOpacity: 1,
              color: isSelected ? "#ffffff" : "rgba(255,255,255,0.7)",
              weight: isSelected ? 2.5 : 1.5,
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

// ─── Map click — closes venue, then suburb-selects ────────────────────────────
function MapClickHandler({
  hasVenue, onClose, onSuburbSelect,
}: {
  hasVenue: boolean;
  onClose: () => void;
  onSuburbSelect: (s: SuburbType) => void;
}) {
  useMapEvents({
    click(e) {
      if (hasVenue) { onClose(); return; }
      let closest: SuburbType | null = null;
      let minDist = Infinity;
      for (const suburb of SUBURBS) {
        const d = e.latlng.distanceTo(L.latLng(SUBURB_COORDS[suburb]));
        if (d < minDist) { minDist = d; closest = suburb; }
      }
      if (closest && minDist < 5000) onSuburbSelect(closest);
    },
  });
  return null;
}

// ─── Venue panel — compact, responsive ───────────────────────────────────────
// Mobile:  compact bottom card (≈220px tall), rounded-t-3xl
// Desktop: floating right panel (w-72), appears beside the map
function VenuePanel({
  venue, timeStep, onClose,
}: {
  venue: Venue; timeStep: number; onClose: () => void;
}) {
  const [vote, setVote] = useState<UserVote>(() => getUserVote(venue.id));
  const [showVibes, setShowVibes] = useState(false);
  const interaction = getVenueInteraction(venue.id);
  const heat = getVenueHeatAtStep(venue, timeStep);
  const flameCount = Math.max(1, Math.round((heat / 100) * 5));
  const pinColor = heatToHex(heat);

  const handleStatus = (status: "going" | "here" | null) => {
    if (status === null) { onClose(); return; }
    const result = setVenueStatus(venue.id, status);
    setVote(result.vote);
    setShowVibes(true);
  };
  const handleVibeTag = (tag: VibeVoteTag) => {
    setVote(setVibeTag(venue.id, tag).vote);
    setTimeout(onClose, 300);
  };

  const VIBE_LABELS: Record<VibeVoteTag, string> = {
    Busy: "Busy", Mid: "Mid", Dead: "Dead", "Good Music": "Music", Expensive: "Pricey",
  };

  return (
    <motion.div
      key={venue.id}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", damping: 32, stiffness: 380 }}
      className={cn(
        // Mobile: bottom card
        "absolute bottom-0 left-0 right-0 z-[1200]",
        "rounded-t-3xl border-t border-zinc-800/80",
        // Desktop: right-side panel
        "md:bottom-auto md:top-14 md:right-4 md:left-auto md:w-72",
        "md:rounded-2xl md:border",
        "bg-zinc-950/96 backdrop-blur-xl",
      )}
      data-testid="venue-panel"
    >
      {/* Image header */}
      <div className="relative overflow-hidden rounded-t-3xl md:rounded-t-2xl"
        style={{ height: "clamp(80px, 22vw, 140px)" }}>
        {venue.imageUrl ? (
          <img src={venue.imageUrl} alt={venue.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
          data-testid="btn-close-venue-panel"
        >
          <X className="h-3 w-3 text-white/70" />
        </button>

        <div className="absolute bottom-2.5 left-3.5">
          <h3 className="text-white font-display font-bold text-base leading-tight drop-shadow">
            {venue.name}
          </h3>
          <p className="text-xs font-medium" style={{ color: pinColor }}>{venue.suburb}</p>
        </div>
      </div>

      {/* Info row */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-zinc-800/60">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            {/* Address */}
            {"address" in venue && venue.address && (
              <p className="text-zinc-500 text-[11px] flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {venue.address as string}
              </p>
            )}
            {/* Heat + price */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Flame
                    key={i}
                    className={cn("h-3 w-3", i < flameCount ? "fill-current" : "opacity-15")}
                    style={i < flameCount ? { color: pinColor } : {}}
                  />
                ))}
              </div>
              <span className="text-zinc-400 text-[11px] font-semibold">
                {"$".repeat(venue.priceLevel)}
              </span>
              <span className="flex items-center gap-0.5 text-zinc-500 text-[11px]">
                <Clock className="h-3 w-3" />
                {venue.closingTime}
              </span>
            </div>
          </div>
          {/* Here now */}
          <div className="flex items-center gap-1 shrink-0">
            <Users className="h-3.5 w-3.5" style={{ color: pinColor }} />
            <span className="text-sm font-bold" style={{ color: pinColor }}>
              {interaction.hereNow}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-3.5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          {!showVibes ? (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-3 gap-2"
            >
              {(["here", "going", null] as const).map((s, i) => {
                const labels = ["Here Now", "Going", "Left"];
                const isActive = vote.status === s;
                return (
                  <button
                    key={i}
                    onClick={() => handleStatus(s)}
                    className={cn(
                      "py-3 rounded-xl text-xs font-bold border transition-all",
                      isActive ? "text-white" : "bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:border-zinc-500",
                    )}
                    style={isActive ? { background: `${pinColor}33`, borderColor: pinColor, color: pinColor } : {}}
                    data-testid={`btn-status-${labels[i].toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {labels[i]}
                  </button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="vibes"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold mb-2 text-center">
                What's the vibe?
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {VIBE_VOTE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleVibeTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                      vote.vibeTag === tag ? "text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300",
                    )}
                    style={vote.vibeTag === tag ? { background: `${pinColor}33`, borderColor: pinColor, color: pinColor } : {}}
                    data-testid={`btn-vibe-${tag.toLowerCase().replace(/\s/g, "-")}`}
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

// ─── Venue card (used inside SuburbSheet) ─────────────────────────────────────
function VenueCard({ venue, timeStep, onTap }: { venue: Venue; timeStep: number; onTap: (v: Venue) => void }) {
  const interaction = getVenueInteraction(venue.id);
  const heat = getVenueHeatAtStep(venue, timeStep);
  const pinColor = heatToHex(heat);
  const flameCount = Math.max(1, Math.round((heat / 100) * 5));

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onTap(venue)}
      className="relative shrink-0 w-36 h-48 rounded-2xl overflow-hidden text-left"
      data-testid={`venue-card-${venue.id}`}
    >
      {venue.imageUrl ? (
        <img src={venue.imageUrl} alt={venue.name}
          className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 bg-zinc-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-black/5" />

      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-white font-display font-bold text-xs leading-tight mb-1">{venue.name}</p>
        <div className="flex items-center gap-0.5 mb-1.5">
          {Array.from({ length: flameCount }).map((_, i) => (
            <Flame key={i} className="h-3 w-3 fill-current" style={{ color: pinColor }} />
          ))}
          {Array.from({ length: 5 - flameCount }).map((_, i) => (
            <Flame key={`e${i}`} className="h-3 w-3 opacity-15 text-white" />
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-white/50 text-[10px]">
          <DollarSign className="h-2.5 w-2.5" />
          <span>{"$".repeat(venue.priceLevel)}</span>
          <span>·</span>
          <Users className="h-2.5 w-2.5" style={{ color: pinColor }} />
          <span style={{ color: pinColor }}>{interaction.hereNow}</span>
        </div>
      </div>
    </motion.button>
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
      className="absolute bottom-0 left-0 right-0 z-[1100] bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/60 rounded-t-3xl md:right-auto md:w-[360px] md:rounded-2xl md:border md:bottom-auto md:left-4 md:top-14"
      data-testid="suburb-sheet"
    >
      <div className="flex justify-center pt-2.5 pb-0.5 md:hidden">
        <div className="w-8 h-1 rounded-full bg-zinc-700" />
      </div>
      <div className="px-4 pt-2 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white font-display font-bold text-lg">{suburb}</h2>
            <p className="text-zinc-500 text-xs">{suburbVenues.length} venues · {formatTimeStep(timeStep)}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"
            data-testid="btn-close-suburb">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="h-0.5 rounded-full bg-zinc-800 overflow-hidden mb-3">
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
          <p className="text-zinc-600 text-sm py-3">No venues here yet.</p>
        ) : (
          suburbVenues.map((v) => (
            <VenueCard key={v.id} venue={v} timeStep={timeStep} onTap={onVenueTap} />
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
    setSelectedSuburb(null);
    setSelectedVenue(venue);
  }, []);

  const handleCloseVenue = useCallback(() => setSelectedVenue(null), []);

  const sliderFill = ((timeStep - TIME_STEP_MIN) / (TIME_STEP_MAX - TIME_STEP_MIN)) * 100;
  const showSlider = !selectedSuburb && !selectedVenue;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0d0e1a]">
      <MapContainer
        center={GC_CENTER}
        zoom={GC_ZOOM}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 10 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <StreetGlowLayer venues={allVenues} timeStep={timeStep} />
        <HeatLayer venues={allVenues} timeStep={timeStep} />
        <VenuePane />
        <VenuePins
          venues={allVenues}
          timeStep={timeStep}
          selectedId={selectedVenue?.id ?? null}
          onVenueTap={handleVenueTap}
        />
        <MapClickHandler
          hasVenue={!!selectedVenue}
          onClose={handleCloseVenue}
          onSuburbSelect={handleSuburbSelect}
        />
        <TrackpadControls />
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

      {/* Time slider — always visible */}
      <AnimatePresence>
        {showSlider && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="absolute bottom-0 left-0 right-0 z-[1000] px-5 pb-10 pt-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
          >
            <div className="text-center mb-3">
              <span className="text-white text-3xl font-display font-black tracking-tight"
                style={{ textShadow: "0 0 20px rgba(168,85,247,0.6)" }}>
                {formatTimeStep(timeStep)}
              </span>
            </div>
            <input
              type="range"
              min={TIME_STEP_MIN} max={TIME_STEP_MAX} step={1}
              value={timeStep}
              onChange={(e) => setTimeStep(Number(e.target.value))}
              className="time-slider pointer-events-auto"
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
            onClose={() => setSelectedSuburb(null)}
            onVenueTap={handleVenueTap}
          />
        )}
      </AnimatePresence>

      {/* Venue panel */}
      <AnimatePresence>
        {selectedVenue && (
          <VenuePanel
            venue={selectedVenue}
            timeStep={timeStep}
            onClose={handleCloseVenue}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
