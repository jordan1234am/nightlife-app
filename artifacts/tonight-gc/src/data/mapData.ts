// ============================
// MAP / HEAT DATA — energy levels per suburb per time slot
// Edit these numbers to tune how "hot" each area feels at different times
// ============================

import { SuburbType } from "./venues";

export type TimeSlot = "8pm" | "10pm" | "12am" | "2am";

export const TIME_SLOTS: TimeSlot[] = ["8pm", "10pm", "12am", "2am"];

// Heat levels 0–100 per suburb per time slot
// Based on typical GC nightlife patterns
const HEAT_DATA: Record<SuburbType, Record<TimeSlot, number>> = {
  "Surfers Paradise": { "8pm": 38, "10pm": 68, "12am": 92, "2am": 82 },
  "Broadbeach":       { "8pm": 52, "10pm": 66, "12am": 72, "2am": 55 },
  "Burleigh":         { "8pm": 62, "10pm": 72, "12am": 50, "2am": 25 },
  "Miami":            { "8pm": 70, "10pm": 58, "12am": 35, "2am": 15 },
  "Coolangatta":      { "8pm": 44, "10pm": 68, "12am": 62, "2am": 45 },
};

export function getHeatLevel(suburb: SuburbType, time: TimeSlot): number {
  return HEAT_DATA[suburb][time];
}

// Returns a colour (as a CSS colour string) for a given 0–100 heat level
// Cool purple → warm violet → hot pink/red
export function heatToColor(heat: number): string {
  if (heat >= 80) return "255, 50, 120";   // hot pink-red
  if (heat >= 60) return "220, 60, 200";   // electric magenta
  if (heat >= 40) return "160, 80, 255";   // purple
  if (heat >= 20) return "100, 80, 200";   // dim violet
  return "60, 60, 120";                    // cold blue-grey
}

// Approximate GC coastal positions for each suburb on a simulated map
// x: 0–100 (west–east), y: 0–100 (north–south along the coast)
export const SUBURB_POSITIONS: Record<SuburbType, { x: number; y: number; label: string }> = {
  "Surfers Paradise": { x: 52, y: 18, label: "Surfers" },
  "Broadbeach":       { x: 56, y: 34, label: "Broadbeach" },
  "Burleigh":         { x: 62, y: 52, label: "Burleigh" },
  "Miami":            { x: 60, y: 66, label: "Miami" },
  "Coolangatta":      { x: 65, y: 84, label: "Coolangatta" },
};
