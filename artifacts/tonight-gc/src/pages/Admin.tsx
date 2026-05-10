import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import {
  saveVenue, deleteVenue, Venue,
  VIBES, SUBURBS, VENUE_TAGS, SEED_VENUE_IDS,
  VibeType, SuburbType,
} from "@/data/venues";
import { useVenues } from "@/hooks/useVenues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, ChevronDown, ChevronUp, MapPin, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Time options for peak/closing pickers ────────────────────────────────────
const TIME_OPTIONS = [
  "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm",
  "12am", "1am", "2am", "3am", "4am", "5am", "6am",
];

// ─── Activity score → colour (matches heat map palette) ───────────────────────
function scoreToColor(score: number): string {
  if (score >= 80) return "#ff5010";
  if (score >= 60) return "#dc1496";
  if (score >= 40) return "#8200ff";
  if (score >= 20) return "#3214f0";
  return "#0f14c8";
}

// ─── Blank form ────────────────────────────────────────────────────────────────
const blankForm = (): Omit<Venue, "id"> => ({
  name: "",
  suburb: "Surfers Paradise",
  lat: undefined,
  lng: undefined,
  imageUrl: "",
  peakTime: "10pm",
  closingTime: "2am",
  priceLevel: 2,
  tags: [],
  activityScore: 65,
  vibes: [],
  crowdLevel: "Medium",
  bestArrivalTime: "9pm",
  bestNights: ["Friday", "Saturday"],
  dressCode: "Smart casual",
  musicType: "",
  description: "",
  goodFor: [],
  notIdealFor: [],
  recommendedReason: "",
});

export default function Admin() {
  const { venues, loading: venuesLoading } = useVenues();
  const [localVenues, setLocalVenues] = useState<Venue[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Venue, "id">>(blankForm());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setLocalVenues(venues); }, [venues]);

  const reset = () => {
    setForm(blankForm());
    setEditingId(null);
    setShowAdvanced(false);
  };

  const set = <K extends keyof Omit<Venue, "id">>(key: K, val: Omit<Venue, "id">[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggleTag = (tag: string) =>
    set("tags", form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag]);

  const toggleVibe = (vibe: VibeType) =>
    set("vibes", form.vibes.includes(vibe) ? form.vibes.filter(v => v !== vibe) : [...form.vibes, vibe]);

  const handleEdit = (venue: Venue) => {
    setForm({
      name: venue.name,
      suburb: venue.suburb,
      lat: venue.lat,
      lng: venue.lng,
      imageUrl: venue.imageUrl,
      peakTime: venue.peakTime ?? "10pm",
      closingTime: venue.closingTime ?? "2am",
      priceLevel: venue.priceLevel,
      tags: venue.tags ?? [],
      activityScore: venue.activityScore ?? 65,
      vibes: venue.vibes ?? [],
      crowdLevel: venue.crowdLevel,
      bestArrivalTime: venue.bestArrivalTime,
      bestNights: venue.bestNights,
      dressCode: venue.dressCode,
      musicType: venue.musicType,
      description: venue.description,
      goodFor: venue.goodFor,
      notIdealFor: venue.notIdealFor,
      recommendedReason: venue.recommendedReason,
    });
    setEditingId(venue.id);
    setShowAdvanced(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this venue?")) return;
    deleteVenue(id);
    setLocalVenues(prev => prev.filter(v => v.id !== id));
    toast({ title: "Venue deleted" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" }); return;
    }
    const id = editingId
      || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const saved = { ...form, id } as Venue;
    saveVenue(saved);
    setLocalVenues(prev => editingId ? prev.map(v => v.id === id ? saved : v) : [...prev, saved]);
    reset();
    toast({ title: editingId ? "Venue updated" : "Venue added", description: form.name });
  };

  const accentColor = scoreToColor(form.activityScore);

  return (
    <div className="min-h-[100dvh] bg-background pb-28 md:pb-12 md:pt-16">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black font-display text-white mb-1">Venue Admin</h1>
          <p className="text-zinc-500 text-sm">{localVenues.length} venues · {localVenues.filter(v => !SEED_VENUE_IDS.includes(v.id)).length} custom</p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">

          {/* ── Form ──────────────────────────────────────────────────────── */}
          <div className="md:col-span-3">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-bold text-white">{editingId ? "Edit Venue" : "Add Venue"}</h2>
                {editingId && (
                  <button onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-6">

                {/* ── Identity ─────────────────────────────────────────────── */}
                <section className="space-y-4">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Identity</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Venue Name *</Label>
                      <Input
                        value={form.name}
                        onChange={e => set("name", e.target.value)}
                        placeholder="e.g. The Pink Flamingo"
                        className="bg-zinc-800/60 border-zinc-700 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Suburb *</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white"
                        value={form.suburb}
                        onChange={e => set("suburb", e.target.value as SuburbType)}
                      >
                        {SUBURBS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Image URL</Label>
                    <Input
                      value={form.imageUrl}
                      onChange={e => set("imageUrl", e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="bg-zinc-800/60 border-zinc-700 text-sm"
                    />
                    {form.imageUrl && (
                      <img src={form.imageUrl} alt="preview"
                        className="mt-1.5 h-24 w-full object-cover rounded-lg border border-zinc-700"
                        onError={e => (e.currentTarget.style.display = "none")} />
                    )}
                  </div>
                </section>

                {/* ── Location ─────────────────────────────────────────────── */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Location</p>
                    <span className="text-[10px] text-zinc-600">for heat map pin</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Latitude</Label>
                      <Input
                        type="number" step="any"
                        value={form.lat ?? ""}
                        onChange={e => set("lat", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="-28.002"
                        className="bg-zinc-800/60 border-zinc-700 text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Longitude</Label>
                      <Input
                        type="number" step="any"
                        value={form.lng ?? ""}
                        onChange={e => set("lng", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="153.432"
                        className="bg-zinc-800/60 border-zinc-700 text-sm font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Right-click any spot on Google Maps and copy the coordinates.
                  </p>
                </section>

                {/* ── Heat map settings ─────────────────────────────────────── */}
                <section className="space-y-4 bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/50">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Heat Map Settings</p>

                  {/* Activity score */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-zinc-400">Activity Score (peak energy)</Label>
                      <span className="text-lg font-black font-display tabular-nums" style={{ color: accentColor }}>
                        {form.activityScore}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range" min={0} max={100} step={1}
                        value={form.activityScore}
                        onChange={e => set("activityScore", Number(e.target.value))}
                        className="time-slider w-full"
                        style={{
                          background: `linear-gradient(to right, #0f14c8, #8200ff 40%, ${accentColor} ${form.activityScore}%, rgba(255,255,255,0.08) ${form.activityScore}%, rgba(255,255,255,0.08) 100%)`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-600">
                      <span>Quiet (0)</span>
                      <span>Medium (50)</span>
                      <span>Hotspot (100)</span>
                    </div>
                  </div>

                  {/* Peak + closing time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Typical Peak Time</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white"
                        value={form.peakTime}
                        onChange={e => set("peakTime", e.target.value)}
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Usual Closing Time</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white"
                        value={form.closingTime}
                        onChange={e => set("closingTime", e.target.value)}
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                {/* ── Character ─────────────────────────────────────────────── */}
                <section className="space-y-4">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Character</p>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Price Level</Label>
                    <div className="flex gap-2">
                      {([1, 2, 3] as const).map(level => (
                        <button
                          key={level} type="button"
                          onClick={() => set("priceLevel", level)}
                          className={cn(
                            "flex-1 py-2 rounded-lg border text-sm font-bold transition-all",
                            form.priceLevel === level
                              ? "border-violet-500 bg-violet-500/20 text-violet-300"
                              : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500",
                          )}
                        >
                          {"$".repeat(level)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Tags</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {VENUE_TAGS.map(tag => (
                        <button
                          key={tag} type="button"
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-full border transition-all",
                            form.tags.includes(tag)
                              ? "border-violet-500 bg-violet-500/20 text-violet-300"
                              : "border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-500",
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Vibes (for filter)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {VIBES.map(vibe => (
                        <button
                          key={vibe} type="button"
                          onClick={() => toggleVibe(vibe)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-full border transition-all",
                            form.vibes.includes(vibe)
                              ? "border-pink-500 bg-pink-500/20 text-pink-300"
                              : "border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-500",
                          )}
                        >
                          {vibe}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* ── Advanced details (collapsible) ─────────────────────────── */}
                <section>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 py-2 border-t border-zinc-800"
                  >
                    <span className="uppercase tracking-widest font-semibold">More details</span>
                    {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-4 pt-4"
                      >
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-400">Short pitch (one-liner for the card)</Label>
                          <Input
                            value={form.recommendedReason}
                            onChange={e => set("recommendedReason", e.target.value)}
                            placeholder="Why should they go tonight?"
                            className="bg-zinc-800/60 border-zinc-700 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-400">Full description</Label>
                          <Textarea
                            value={form.description}
                            onChange={e => set("description", e.target.value)}
                            placeholder="Detailed description..."
                            className="min-h-[80px] bg-zinc-800/60 border-zinc-700 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-zinc-400">Music type</Label>
                            <Input
                              value={form.musicType}
                              onChange={e => set("musicType", e.target.value)}
                              placeholder="House, R&B..."
                              className="bg-zinc-800/60 border-zinc-700 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-zinc-400">Dress code</Label>
                            <Input
                              value={form.dressCode}
                              onChange={e => set("dressCode", e.target.value)}
                              placeholder="Smart casual"
                              className="bg-zinc-800/60 border-zinc-700 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-400">Good for (comma separated)</Label>
                          <Input
                            value={form.goodFor.join(", ")}
                            onChange={e => set("goodFor", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                            placeholder="Groups, Couples, Late nights"
                            className="bg-zinc-800/60 border-zinc-700 text-sm"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* ── Submit ─────────────────────────────────────────────────── */}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-500 text-white">
                    <Plus className="h-4 w-4 mr-1.5" />
                    {editingId ? "Update Venue" : "Add Venue"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={reset}
                      className="border-zinc-700 text-zinc-400">
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ── Venue list ────────────────────────────────────────────────── */}
          <div className="md:col-span-2">
            <div className="sticky top-4 space-y-3 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
              <h3 className="font-bold text-white text-lg font-display">All Venues</h3>
              {localVenues.map(venue => {
                const isCustom = !SEED_VENUE_IDS.includes(venue.id);
                const color = scoreToColor(venue.activityScore ?? 65);
                return (
                  <div
                    key={venue.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all",
                      isCustom ? "border-violet-500/30 bg-violet-500/5" : "border-zinc-800 bg-zinc-900/50",
                      editingId === venue.id && "ring-1 ring-violet-500",
                    )}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {venue.imageUrl && (
                        <img src={venue.imageUrl} alt={venue.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-zinc-700" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-white truncate">{venue.name}</p>
                        <p className="text-xs text-zinc-500">{venue.suburb}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Flame className="h-3 w-3" style={{ color }} />
                        <span className="text-xs font-bold tabular-nums" style={{ color }}>
                          {venue.activityScore ?? "—"}
                        </span>
                      </div>
                    </div>

                    {/* Tags preview */}
                    {venue.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {venue.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {tag}
                          </span>
                        ))}
                        {venue.tags.length > 3 && (
                          <span className="text-[10px] text-zinc-600">+{venue.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-1.5 text-[10px] text-zinc-600 mb-2">
                      <span>Peak {venue.peakTime}</span>
                      <span>·</span>
                      <span>Closes {venue.closingTime}</span>
                      <span>·</span>
                      <span>{"$".repeat(venue.priceLevel)}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(venue)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </button>
                      {isCustom && (
                        <button
                          onClick={() => handleDelete(venue.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
