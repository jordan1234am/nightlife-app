// ============================
// INTERACTION DATA — localStorage helpers for crowd sourced venue energy
// ============================

export type VibeVoteTag = "Busy" | "Dead" | "Good Vibes" | "Not It" | "Good Music" | "Expensive";
export type SocialTag = "Friendly" | "Mixed" | "Closed Groups";
export type HotspotLevel = "Quiet" | "Building" | "Busy" | "Hotspot";

export interface VenueInteraction {
  venueId: string;
  // Aggregate counts (seeded + user contributions)
  peopleGoing: number;
  hereNow: number;
  vibeVotes: Record<VibeVoteTag, number>;
  socialVotes: Record<SocialTag, number>;
}

export interface UserVote {
  venueId: string;
  status: "going" | "here" | null;
  vibeTag: VibeVoteTag | null;
  socialTag: SocialTag | null;
}

const INTERACTION_KEY = "tonightgc_interactions";
const USER_VOTES_KEY = "tonightgc_uservotes";

// ============================
// SEED interaction data — edit the initial energy numbers here
// ============================
const SEED_INTERACTIONS: Record<string, VenueInteraction> = {
  "surfers-pavilion":  { venueId: "surfers-pavilion",  peopleGoing: 24, hereNow: 11, vibeVotes: { Busy: 4, Dead: 0, "Good Vibes": 9, "Not It": 1, "Good Music": 3, Expensive: 2 }, socialVotes: { Friendly: 8, Mixed: 3, "Closed Groups": 1 } },
  "cali-beach":        { venueId: "cali-beach",        peopleGoing: 87, hereNow: 62, vibeVotes: { Busy: 40, Dead: 0, "Good Vibes": 28, "Not It": 2, "Good Music": 35, Expensive: 12 }, socialVotes: { Friendly: 20, Mixed: 30, "Closed Groups": 12 } },
  "the-avenue":        { venueId: "the-avenue",        peopleGoing: 113, hereNow: 78, vibeVotes: { Busy: 65, Dead: 0, "Good Vibes": 42, "Not It": 5, "Good Music": 58, Expensive: 48 }, socialVotes: { Friendly: 15, Mixed: 38, "Closed Groups": 25 } },
  "burleigh-pavilion": { venueId: "burleigh-pavilion", peopleGoing: 41, hereNow: 28, vibeVotes: { Busy: 10, Dead: 1, "Good Vibes": 22, "Not It": 2, "Good Music": 8, Expensive: 5 }, socialVotes: { Friendly: 20, Mixed: 12, "Closed Groups": 3 } },
  "miami-marketta":    { venueId: "miami-marketta",    peopleGoing: 95, hereNow: 71, vibeVotes: { Busy: 35, Dead: 0, "Good Vibes": 55, "Not It": 1, "Good Music": 40, Expensive: 0 }, socialVotes: { Friendly: 55, Mixed: 20, "Closed Groups": 2 } },
  "loose-moose":       { venueId: "loose-moose",       peopleGoing: 68, hereNow: 44, vibeVotes: { Busy: 30, Dead: 2, "Good Vibes": 32, "Not It": 4, "Good Music": 18, Expensive: 3 }, socialVotes: { Friendly: 35, Mixed: 18, "Closed Groups": 5 } },
  "justin-lane":       { venueId: "justin-lane",       peopleGoing: 33, hereNow: 19, vibeVotes: { Busy: 8, Dead: 1, "Good Vibes": 18, "Not It": 2, "Good Music": 6, Expensive: 7 }, socialVotes: { Friendly: 16, Mixed: 10, "Closed Groups": 4 } },
  "coolangatta-hotel": { venueId: "coolangatta-hotel", peopleGoing: 52, hereNow: 37, vibeVotes: { Busy: 22, Dead: 0, "Good Vibes": 30, "Not It": 1, "Good Music": 28, Expensive: 1 }, socialVotes: { Friendly: 32, Mixed: 14, "Closed Groups": 3 } },
};

export function getInteractions(): Record<string, VenueInteraction> {
  try {
    const stored = localStorage.getItem(INTERACTION_KEY);
    if (stored) {
      const overrides: Record<string, Partial<VenueInteraction>> = JSON.parse(stored);
      const merged: Record<string, VenueInteraction> = { ...SEED_INTERACTIONS };
      for (const id of Object.keys(overrides)) {
        merged[id] = { ...SEED_INTERACTIONS[id], ...overrides[id] };
      }
      return merged;
    }
  } catch {}
  return { ...SEED_INTERACTIONS };
}

export function getVenueInteraction(venueId: string): VenueInteraction {
  const all = getInteractions();
  return all[venueId] ?? {
    venueId,
    peopleGoing: 0,
    hereNow: 0,
    vibeVotes: { Busy: 0, Dead: 0, "Good Vibes": 0, "Not It": 0, "Good Music": 0, Expensive: 0 },
    socialVotes: { Friendly: 0, Mixed: 0, "Closed Groups": 0 },
  };
}

function saveInteractionOverride(interaction: VenueInteraction) {
  try {
    const stored = localStorage.getItem(INTERACTION_KEY);
    const overrides: Record<string, Partial<VenueInteraction>> = stored ? JSON.parse(stored) : {};
    overrides[interaction.venueId] = interaction;
    localStorage.setItem(INTERACTION_KEY, JSON.stringify(overrides));
  } catch {}
}

export function getUserVotes(): Record<string, UserVote> {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {}
  return {};
}

function saveUserVote(vote: UserVote) {
  try {
    const votes = getUserVotes();
    votes[vote.venueId] = vote;
    localStorage.setItem(USER_VOTES_KEY, JSON.stringify(votes));
  } catch {}
}

export function getUserVote(venueId: string): UserVote {
  const votes = getUserVotes();
  return votes[venueId] ?? { venueId, status: null, vibeTag: null, socialTag: null };
}

// Toggle going/here status
export function toggleStatus(venueId: string, status: "going" | "here"): { interaction: VenueInteraction; vote: UserVote } {
  const interaction = getVenueInteraction(venueId);
  const vote = getUserVote(venueId);
  const prev = vote.status;
  const next = prev === status ? null : status;

  if (prev === "going") interaction.peopleGoing = Math.max(0, interaction.peopleGoing - 1);
  if (prev === "here") interaction.hereNow = Math.max(0, interaction.hereNow - 1);
  if (next === "going") interaction.peopleGoing += 1;
  if (next === "here") interaction.hereNow += 1;

  vote.status = next;
  saveInteractionOverride(interaction);
  saveUserVote(vote);
  return { interaction, vote };
}

// Toggle a vibe tag vote
export function toggleVibeTag(venueId: string, tag: VibeVoteTag): { interaction: VenueInteraction; vote: UserVote } {
  const interaction = getVenueInteraction(venueId);
  const vote = getUserVote(venueId);
  const prev = vote.vibeTag;
  const next = prev === tag ? null : tag;

  if (prev) interaction.vibeVotes[prev] = Math.max(0, interaction.vibeVotes[prev] - 1);
  if (next) interaction.vibeVotes[next] = interaction.vibeVotes[next] + 1;

  vote.vibeTag = next;
  saveInteractionOverride(interaction);
  saveUserVote(vote);
  return { interaction, vote };
}

// Toggle a social openness vote
export function toggleSocialTag(venueId: string, tag: SocialTag): { interaction: VenueInteraction; vote: UserVote } {
  const interaction = getVenueInteraction(venueId);
  const vote = getUserVote(venueId);
  const prev = vote.socialTag;
  const next = prev === tag ? null : tag;

  if (prev) interaction.socialVotes[prev] = Math.max(0, interaction.socialVotes[prev] - 1);
  if (next) interaction.socialVotes[next] = interaction.socialVotes[next] + 1;

  vote.socialTag = next;
  saveInteractionOverride(interaction);
  saveUserVote(vote);
  return { interaction, vote };
}

// Derive hotspot level from aggregate activity
export function getHotspotLevel(interaction: VenueInteraction): HotspotLevel {
  const total = interaction.peopleGoing + interaction.hereNow;
  if (total >= 100) return "Hotspot";
  if (total >= 50) return "Busy";
  if (total >= 20) return "Building";
  return "Quiet";
}

// Get dominant social openness tag
export function getDominantSocialTag(interaction: VenueInteraction): SocialTag | null {
  const tags = Object.entries(interaction.socialVotes) as [SocialTag, number][];
  const max = tags.reduce((a, b) => (b[1] > a[1] ? b : a), ["Friendly", 0] as [SocialTag, number]);
  return max[1] > 0 ? max[0] : null;
}

export const VIBE_VOTE_TAGS: VibeVoteTag[] = ["Busy", "Dead", "Good Vibes", "Not It", "Good Music", "Expensive"];
export const SOCIAL_TAGS: SocialTag[] = ["Friendly", "Mixed", "Closed Groups"];
