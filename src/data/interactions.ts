// ============================
// INTERACTION DATA — localStorage helpers for crowd-sourced venue energy
// ============================

export type VibeVoteTag = "Busy" | "Mid" | "Dead" | "Good Music" | "Expensive";
export type SocialTag = "Friendly" | "Mixed" | "Closed Groups";
export type HotspotLevel = "Quiet" | "Building" | "Busy" | "Hotspot";

export interface VenueInteraction {
  venueId: string;
  peopleGoing: number;
  hereNow: number;
  vibeVotes: Record<VibeVoteTag, number>;
}

export interface UserVote {
  venueId: string;
  status: "going" | "here" | null;
  vibeTag: VibeVoteTag | null;
}

const INTERACTION_KEY = "tonightgc_interactions";
const USER_VOTES_KEY = "tonightgc_uservotes";

// ============================
// SEED interaction data — edit initial crowd numbers here
// ============================
const SEED_INTERACTIONS: Record<string, VenueInteraction> = {
  "surfers-pavilion":  { venueId: "surfers-pavilion",  peopleGoing: 24, hereNow: 11, vibeVotes: { Busy: 4, Mid: 2, Dead: 0, "Good Music": 3, Expensive: 2 } },
  "cali-beach":        { venueId: "cali-beach",        peopleGoing: 87, hereNow: 62, vibeVotes: { Busy: 40, Mid: 5, Dead: 0, "Good Music": 35, Expensive: 12 } },
  "the-avenue":        { venueId: "the-avenue",        peopleGoing: 113, hereNow: 78, vibeVotes: { Busy: 65, Mid: 8, Dead: 0, "Good Music": 58, Expensive: 48 } },
  "burleigh-pavilion": { venueId: "burleigh-pavilion", peopleGoing: 41, hereNow: 28, vibeVotes: { Busy: 10, Mid: 6, Dead: 1, "Good Music": 8, Expensive: 5 } },
  "miami-marketta":    { venueId: "miami-marketta",    peopleGoing: 95, hereNow: 71, vibeVotes: { Busy: 35, Mid: 4, Dead: 0, "Good Music": 40, Expensive: 0 } },
  "loose-moose":       { venueId: "loose-moose",       peopleGoing: 68, hereNow: 44, vibeVotes: { Busy: 30, Mid: 8, Dead: 2, "Good Music": 18, Expensive: 3 } },
  "justin-lane":       { venueId: "justin-lane",       peopleGoing: 33, hereNow: 19, vibeVotes: { Busy: 8, Mid: 5, Dead: 1, "Good Music": 6, Expensive: 7 } },
  "coolangatta-hotel": { venueId: "coolangatta-hotel", peopleGoing: 52, hereNow: 37, vibeVotes: { Busy: 22, Mid: 4, Dead: 0, "Good Music": 28, Expensive: 1 } },
};

function loadOverrides(): Record<string, VenueInteraction> {
  try {
    const stored = localStorage.getItem(INTERACTION_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

export function getVenueInteraction(venueId: string): VenueInteraction {
  const overrides = loadOverrides();
  return overrides[venueId] ?? SEED_INTERACTIONS[venueId] ?? {
    venueId, peopleGoing: 0, hereNow: 0,
    vibeVotes: { Busy: 0, Mid: 0, Dead: 0, "Good Music": 0, Expensive: 0 },
  };
}

function saveInteraction(interaction: VenueInteraction) {
  try {
    const overrides = loadOverrides();
    overrides[interaction.venueId] = interaction;
    localStorage.setItem(INTERACTION_KEY, JSON.stringify(overrides));
  } catch {}
}

export function getUserVotes(): Record<string, UserVote> {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

export function getUserVote(venueId: string): UserVote {
  return getUserVotes()[venueId] ?? { venueId, status: null, vibeTag: null };
}

function saveUserVote(vote: UserVote) {
  try {
    const votes = getUserVotes();
    votes[vote.venueId] = vote;
    localStorage.setItem(USER_VOTES_KEY, JSON.stringify(votes));
  } catch {}
}

export function setVenueStatus(
  venueId: string,
  status: "going" | "here" | null
): { interaction: VenueInteraction; vote: UserVote } {
  const interaction = getVenueInteraction(venueId);
  const vote = getUserVote(venueId);
  const prev = vote.status;

  if (prev === "going") interaction.peopleGoing = Math.max(0, interaction.peopleGoing - 1);
  if (prev === "here") interaction.hereNow = Math.max(0, interaction.hereNow - 1);
  if (status === "going") interaction.peopleGoing += 1;
  if (status === "here") interaction.hereNow += 1;

  vote.status = status;
  saveInteraction(interaction);
  saveUserVote(vote);
  return { interaction, vote };
}

export function setVibeTag(
  venueId: string,
  tag: VibeVoteTag
): { interaction: VenueInteraction; vote: UserVote } {
  const interaction = getVenueInteraction(venueId);
  const vote = getUserVote(venueId);
  const prev = vote.vibeTag;

  if (prev) interaction.vibeVotes[prev] = Math.max(0, interaction.vibeVotes[prev] - 1);
  interaction.vibeVotes[tag] += 1;

  vote.vibeTag = tag;
  saveInteraction(interaction);
  saveUserVote(vote);
  return { interaction, vote };
}

export function getHotspotLevel(interaction: VenueInteraction): HotspotLevel {
  const total = interaction.peopleGoing + interaction.hereNow;
  if (total >= 100) return "Hotspot";
  if (total >= 50) return "Busy";
  if (total >= 20) return "Building";
  return "Quiet";
}

export const VIBE_VOTE_TAGS: VibeVoteTag[] = ["Busy", "Mid", "Dead", "Good Music", "Expensive"];
