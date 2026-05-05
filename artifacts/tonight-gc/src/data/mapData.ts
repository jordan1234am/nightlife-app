// ============================
// MAP DATA — lat/lng positions and heat levels for each Gold Coast suburb
// Edit heat anchor values to tune energy at different times
// ============================

import { SuburbType } from "./venues";

// ─── Lat/lng for each suburb on the Gold Coast ───────────────────────────────
export const SUBURB_COORDS: Record<SuburbType, [number, number]> = {
  "Surfers Paradise": [-28.002, 153.428],
  "Broadbeach":       [-28.027, 153.431],
  "Burleigh":         [-28.087, 153.451],
  "Miami":            [-28.067, 153.443],
  "Coolangatta":      [-28.165, 153.540],
};

export const GC_CENTER: [number, number] = [-28.050, 153.435];
export const GC_ZOOM = 12;

// ─── Time slider ─────────────────────────────────────────────────────────────
// Range: 0-48 where each step = 15 minutes starting at 6pm
// Step 0 = 6:00pm, Step 8 = 8:00pm, Step 24 = 12:00am, Step 48 = 6:00am
export const TIME_STEP_MIN = 0;
export const TIME_STEP_MAX = 48;
export const DEFAULT_TIME_STEP = 16; // 10pm

export function formatTimeStep(step: number): string {
  const totalMins = (18 * 60 + step * 15) % (24 * 60);
  const hours24 = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  return `${hours12}:${mins.toString().padStart(2, "0")}${period}`;
}

// ─── Heat anchor data ─────────────────────────────────────────────────────────
// Edit these values to change how hot each area feels at different times.
// Each entry is [timeStep, heatLevel 0-100]
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const HEAT_ANCHORS: Record<SuburbType, [number, number][]> = {
  "Surfers Paradise": [[0, 8], [8, 38], [16, 68], [24, 92], [32, 82], [40, 30], [48, 5]],
  "Broadbeach":       [[0, 10], [8, 52], [16, 66], [24, 72], [32, 55], [40, 20], [48, 5]],
  "Burleigh":         [[0, 15], [8, 62], [16, 72], [24, 50], [32, 25], [40, 10], [48, 4]],
  "Miami":            [[0, 20], [8, 70], [16, 58], [24, 35], [32, 15], [40, 5], [48, 3]],
  "Coolangatta":      [[0, 10], [8, 44], [16, 68], [24, 62], [32, 45], [40, 20], [48, 5]],
};

export function getHeatAtStep(suburb: SuburbType, step: number): number {
  const anchors = HEAT_ANCHORS[suburb];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [s0, h0] = anchors[i];
    const [s1, h1] = anchors[i + 1];
    if (step >= s0 && step <= s1) {
      const t = (step - s0) / (s1 - s0);
      return Math.round(lerp(h0, h1, t));
    }
  }
  return 5;
}

// ─── Color mapping based on heat 0-100 ───────────────────────────────────────
export function heatToColor(heat: number): string {
  if (heat >= 80) return "#ff4433"; // red-hot
  if (heat >= 60) return "#e040fb"; // electric magenta
  if (heat >= 40) return "#7c3aed"; // violet
  if (heat >= 20) return "#3730a3"; // indigo
  return "#1e3a5f";                  // dark navy
}

// ─── Circle sizing based on heat ──────────────────────────────────────────────
export function heatToRadius(heat: number): number {
  return 280 + (heat / 100) * 520; // 280m (quiet) → 800m (hotspot)
}
