// Level rating for 2v2 padel matches: an Elo-style update where the
// "expected" outcome comes from the average level of each pair, and the
// "actual" outcome is the share of games won across sets (a margin, not
// just a win/loss flag) — a comfortable straight-sets win moves levels
// more than a narrow three-set match with the same winner.

export const MIN_LEVEL = 1.0;
export const MAX_LEVEL = 7.0;

// Level-point gap between two pairs' averages that corresponds to a ~91%
// win expectation for the stronger pair (10^(1) odds, as in Elo).
const EXPECTATION_SPREAD = 2.0;

// Largest level movement a single match can cause (when the result was
// maximally unexpected, i.e. a heavy underdog pair sweeps the match).
const K_FACTOR = 0.4;

export type SetScore = { team1: number; team2: number };

export type PlayerLevel = { userId: string; level: number };

export type MatchLevelInput = {
  team1: [PlayerLevel, PlayerLevel];
  team2: [PlayerLevel, PlayerLevel];
  sets: SetScore[];
};

export type PlayerLevelResult = {
  userId: string;
  delta: number;
  newLevel: number;
};

export function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
}

function average(a: number, b: number): number {
  return (a + b) / 2;
}

// Elo-style expected score for team1 from the average level gap.
function expectedScore(avgTeam1: number, avgTeam2: number): number {
  return 1 / (1 + Math.pow(10, (avgTeam2 - avgTeam1) / EXPECTATION_SPREAD));
}

// team1's share of total games played across all sets — a continuous
// margin rather than a binary win/loss.
function actualScore(sets: SetScore[]): number {
  const totals = sets.reduce(
    (acc, set) => ({
      team1: acc.team1 + set.team1,
      team2: acc.team2 + set.team2,
    }),
    { team1: 0, team2: 0 },
  );
  const totalGames = totals.team1 + totals.team2;
  return totalGames === 0 ? 0.5 : totals.team1 / totalGames;
}

export function calculateNewLevels(
  input: MatchLevelInput,
): PlayerLevelResult[] {
  const avgTeam1 = average(input.team1[0].level, input.team1[1].level);
  const avgTeam2 = average(input.team2[0].level, input.team2[1].level);

  const expected = expectedScore(avgTeam1, avgTeam2);
  const actual = actualScore(input.sets);

  const deltaTeam1 = K_FACTOR * (actual - expected);
  const deltaTeam2 = -deltaTeam1;

  const applyDelta = (
    players: [PlayerLevel, PlayerLevel],
    delta: number,
  ): PlayerLevelResult[] =>
    players.map((player) => ({
      userId: player.userId,
      delta,
      newLevel: clampLevel(player.level + delta),
    }));

  return [
    ...applyDelta(input.team1, deltaTeam1),
    ...applyDelta(input.team2, deltaTeam2),
  ];
}

// Reads a match_results row (nullable set3) into the SetScore[] the
// calculator expects, dropping sets that weren't played.
export function toSetScores(row: {
  set1_team1: number | null;
  set1_team2: number | null;
  set2_team1: number | null;
  set2_team2: number | null;
  set3_team1: number | null;
  set3_team2: number | null;
}): SetScore[] {
  const sets: SetScore[] = [];
  if (row.set1_team1 !== null && row.set1_team2 !== null) {
    sets.push({ team1: row.set1_team1, team2: row.set1_team2 });
  }
  if (row.set2_team1 !== null && row.set2_team2 !== null) {
    sets.push({ team1: row.set2_team1, team2: row.set2_team2 });
  }
  if (row.set3_team1 !== null && row.set3_team2 !== null) {
    sets.push({ team1: row.set3_team1, team2: row.set3_team2 });
  }
  return sets;
}
