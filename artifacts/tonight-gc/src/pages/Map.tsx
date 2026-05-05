import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, DollarSign, Clock, Users, MapPin, Ticket, Timer } from "lucide-react";
import L from "leaflet";
import { getVenues, getVenueHeatAtStep, SUBURBS, SuburbType, Venue, VibeType, parseTimeToStep } from "@/data/venues";
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
// Mac trackpad fires WheelEvent:
//   ctrlKey=true  → pinch gesture (spread = zoom in, pinch = zoom out)
//   ctrlKey=false → two-finger swipe (pan)
// zoomSnap={0} on MapContainer lets Leaflet accept fractional zoom so pinch
// feels smooth and continuous, just like Safari / Apple Maps.
function TrackpadControls() {
  const map = useMap();
  const pendingZoom = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const container = map.getContainer();

    const flushZoom = () => {
      if (pendingZoom.current === 0) return;
      const next = Math.max(9, Math.min(19, map.getZoom() + pendingZoom.current));
      map.setZoom(next, { animate: false });
      pendingZoom.current = 0;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.ctrlKey) {
        // Pinch gesture: negative deltaY = spread fingers = zoom in
        pendingZoom.current += -e.deltaY * 0.012;
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(flushZoom);
      } else {
        // Two-finger swipe → pan only (scale factor 1 = 1:1 with finger speed)
        map.panBy([e.deltaX, e.deltaY], { animate: false });
      }
    };

    // Must be non-passive so we can preventDefault
    container.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      container.removeEventListener("wheel", onWheel, { capture: true });
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
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

// ─── Venue panel derived stats ────────────────────────────────────────────────
function entryPrice(priceLevel: 1 | 2 | 3): string {
  return priceLevel === 1 ? "Free" : priceLevel === 2 ? "~$10" : "~$20";
}
function drinkPrice(priceLevel: 1 | 2 | 3): string {
  return priceLevel === 1 ? "$8-12" : priceLevel === 2 ? "$14-18" : "$18+";
}
function waitTime(heat: number): string {
  if (heat < 25) return "No queue";
  if (heat < 50) return "~5 min";
  if (heat < 72) return "~15 min";
  return "~25 min";
}
function closingStatus(venue: Venue, timeStep: number): string {
  const closeStep = parseTimeToStep(venue.closingTime);
  if (timeStep >= closeStep) return "Closed";
  if (timeStep >= closeStep - 4) return "Closing soon";
  return `Until ${venue.closingTime}`;
}

// ─── Venue panel — compact, responsive ───────────────────────────────────────
// Mobile:  compact bottom card, rounded-t-3xl
// Desktop: floating right panel (w-72)
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
  const isClosed = closingStatus(venue, timeStep) === "Closed";

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

  // Info pill component
  const Pill = ({ icon, label, value, warn }: { icon: React.ReactNode; label: string; value: string; warn?: boolean }) => (
    <div className="flex items-center gap-2 py-2 px-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
      <span className="shrink-0" style={{ color: warn ? "#f87171" : pinColor }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-zinc-600 text-[9px] uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className={cn("text-xs font-bold leading-none", warn ? "text-red-400" : "text-white")}>{value}</p>
      </div>
    </div>
  );

  return (
    <motion.div
      key={venue.id}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", damping: 32, stiffness: 380 }}
      className={cn(
        "absolute bottom-0 left-0 right-0 z-[1200]",
        "rounded-t-3xl border-t border-zinc-800/80",
        "md:bottom-auto md:top-14 md:right-4 md:left-auto md:w-72",
        "md:rounded-2xl md:border",
        "bg-zinc-950/96 backdrop-blur-xl",
      )}
      data-testid="venue-panel"
    >
      {/* Image header */}
      <div className="relative overflow-hidden rounded-t-3xl md:rounded-t-2xl"
        style={{ height: "clamp(80px, 20vw, 130px)" }}>
        {venue.imageUrl ? (
          <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center"
          data-testid="btn-close-venue-panel"
        >
          <X className="h-3 w-3 text-white/70" />
        </button>

        <div className="absolute bottom-2.5 left-3.5 right-10">
          <h3 className="text-white font-display font-bold text-sm leading-tight drop-shadow truncate">
            {venue.name}
          </h3>
          {"address" in venue && venue.address && (
            <p className="text-zinc-400 text-[10px] flex items-center gap-0.5 mt-0.5 truncate">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              {venue.address as string}
            </p>
          )}
        </div>
      </div>

      {/* Crowd flames + here now */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Flame
              key={i}
              className={cn("h-3.5 w-3.5", i < flameCount ? "fill-current" : "opacity-12")}
              style={i < flameCount ? { color: pinColor } : {}}
            />
          ))}
          <span className="ml-1.5 text-zinc-500 text-[11px] font-medium">{heat}% capacity</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" style={{ color: pinColor }} />
          <span className="text-sm font-bold" style={{ color: pinColor }}>{interaction.hereNow}</span>
          <span className="text-zinc-600 text-[10px]">here</span>
        </div>
      </div>

      {/* Info grid — 3 across */}
      <div className="px-3.5 pb-2.5 grid grid-cols-3 gap-1.5 border-b border-zinc-800/50">
        <Pill icon={<Ticket className="h-3 w-3" />} label="Entry" value={entryPrice(venue.priceLevel)} />
        <Pill icon={<Timer className="h-3 w-3" />} label="Queue" value={waitTime(heat)} />
        <Pill
          icon={<Clock className="h-3 w-3" />}
          label="Closes"
          value={closingStatus(venue, timeStep)}
          warn={isClosed}
        />
        <Pill icon={<DollarSign className="h-3 w-3" />} label="Drinks" value={drinkPrice(venue.priceLevel)} />
        <div className="col-span-2 flex items-center gap-2 py-2 px-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/60">
          <span className="shrink-0" style={{ color: pinColor }}>
            <Flame className="h-3 w-3 fill-current" />
          </span>
          <div>
            <p className="text-zinc-600 text-[9px] uppercase tracking-widest leading-none mb-0.5">Tags</p>
            <p className="text-white text-[10px] font-semibold leading-none truncate">
              {venue.tags.slice(0, 3).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-3.5 py-3 pb-[max(14px,env(safe-area-inset-bottom))]">
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
                      "py-2.5 rounded-xl text-xs font-bold border transition-all",
                      isActive ? "" : "bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:border-zinc-500",
                    )}
                    style={isActive ? { background: `${pinColor}28`, borderColor: pinColor, color: pinColor } : {}}
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
              <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold mb-2 text-center">
                What's the vibe?
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {VIBE_VOTE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleVibeTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                      vote.vibeTag === tag ? "" : "bg-zinc-900 border-zinc-700 text-zinc-300",
                    )}
                    style={vote.vibeTag === tag ? { background: `${pinColor}28`, borderColor: pinColor, color: pinColor } : {}}
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

// ─── Night heat timeline ──────────────────────────────────────────────────────
// A gradient track that visually encodes GC-wide nightlife energy across the
// evening. Each colour stop is tuned to the real peak-heat profile from mapData:
//   6pm → deep indigo (quiet)
//   9pm → violet (warming up)
//   11pm–1am → red/orange (peak)
//   3am+ → violet → indigo (tapering)
//   6am → near black (done)
const HEAT_GRADIENT =
  "linear-gradient(to right," +
  "#0f0a2a 0%," +     // 6pm
  "#1a1060 8%," +     // 7pm
  "#4c1d95 17%," +    // 8pm — purple builds
  "#7c3aed 28%," +    // 9:30pm
  "#c026d3 41%," +    // 11pm — electric magenta
  "#e11d48 50%," +    // 12am — red hot peak
  "#f97316 58%," +    // 1am — orange
  "#e11d48 67%," +    // 2am — tapering red
  "#9333ea 75%," +    // 3am — violet
  "#4f46e5 83%," +    // 4am — indigo
  "#1e3a5f 91%," +    // 5am
  "#0a0a14 100%" +    // 6am
  ")";

function timeToThumbColor(step: number): string {
  const t = step / TIME_STEP_MAX;
  if (t < 0.17) return "#4c1d95";
  if (t < 0.28) return "#7c3aed";
  if (t < 0.41) return "#c026d3";
  if (t < 0.54) return "#e11d48";
  if (t < 0.62) return "#f97316";
  if (t < 0.70) return "#e11d48";
  if (t < 0.78) return "#9333ea";
  if (t < 0.88) return "#4f46e5";
  return "#1e3a5f";
}

function HeatTimeline({ timeStep, onChange }: { timeStep: number; onChange: (s: number) => void }) {
  const pct = (timeStep - TIME_STEP_MIN) / (TIME_STEP_MAX - TIME_STEP_MIN);
  const glowColor = timeToThumbColor(timeStep);
  const timeLabel = formatTimeStep(timeStep);

  // CSS calc trick: left = pct*(100% - 20px) + 10px
  // This places the centre of a 20px thumb at the correct track position
  // without needing a JS ResizeObserver.
  const thumbStyle = {
    left: `calc(${pct * 100}% - ${pct * 20}px + 10px)`,
    transform: "translateX(-50%)",
  };

  return (
    <div className="px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-3">
      {/* Floating time label — tracks the thumb */}
      <div className="relative h-9 mb-1 pointer-events-none">
        <div
          className="absolute bottom-0 whitespace-nowrap"
          style={{ ...thumbStyle, transform: "translateX(-50%)" }}
        >
          <span
            className="text-white font-display font-black text-2xl tracking-tight"
            style={{ textShadow: `0 0 24px ${glowColor}` }}
          >
            {timeLabel}
          </span>
        </div>
      </div>

      {/* Track */}
      <div
        className="relative h-3 rounded-full overflow-visible"
        style={{ background: HEAT_GRADIENT }}
      >
        {/* Glowing thumb (visual only) */}
        <div
          className="absolute top-1/2 w-5 h-5 rounded-full border-2 border-white/90 pointer-events-none"
          style={{
            ...thumbStyle,
            marginTop: "-10px",
            background: glowColor,
            boxShadow: `0 0 0 3px ${glowColor}55, 0 0 18px ${glowColor}`,
          }}
        />

        {/* Invisible range input — handles all interaction */}
        <input
          type="range"
          min={TIME_STEP_MIN}
          max={TIME_STEP_MAX}
          step={1}
          value={timeStep}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: "100%", margin: 0 }}
          data-testid="time-slider"
        />
      </div>

      {/* Hour labels */}
      <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-medium select-none">
        <span>6pm</span>
        <span>9pm</span>
        <span>12am</span>
        <span>3am</span>
        <span>6am</span>
      </div>
    </div>
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

  // Timeline always visible — disappears only when a sheet is open on mobile
  const showTimeline = !selectedSuburb && !selectedVenue;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0d0e1a]">
      <MapContainer
        center={GC_CENTER}
        zoom={GC_ZOOM}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        // zoomSnap=0 → Leaflet accepts fractional zoom so pinch is continuous
        zoomSnap={0}
        zoomDelta={1}
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

      {/* Heat timeline — always visible when no sheet is open */}
      <AnimatePresence>
        {showTimeline && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 z-[1000] bg-gradient-to-t from-black/85 via-black/50 to-transparent pointer-events-none"
          >
            <div className="pointer-events-auto">
              <HeatTimeline timeStep={timeStep} onChange={setTimeStep} />
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
