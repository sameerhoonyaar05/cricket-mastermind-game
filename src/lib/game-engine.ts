export type TossCall = "heads" | "tails";
export type TossDecision = "bat" | "bowl";
export type ShotChoice = "defend" | "drive" | "loft" | "sweep";
export type DeliveryChoice = "line" | "length" | "yorker" | "bouncer";
export type Side = "player" | "opponent";
export type GamePhase =
  | "setup"
  | "toss"
  | "toss-decision"
  | "ready"
  | "playing"
  | "innings-break"
  | "complete";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  accent: string;
}

export const TEAMS: Team[] = [
  { id: "india", name: "India", shortName: "IND", color: "#167a58", accent: "#f49a35" },
  { id: "australia", name: "Australia", shortName: "AUS", color: "#1268a8", accent: "#f4c542" },
  { id: "england", name: "England", shortName: "ENG", color: "#bf3445", accent: "#f4f1e9" },
  { id: "south-africa", name: "South Africa", shortName: "SA", color: "#19875b", accent: "#e2bd36" },
  { id: "new-zealand", name: "New Zealand", shortName: "NZ", color: "#27313b", accent: "#d9e0e2" },
  { id: "pakistan", name: "Pakistan", shortName: "PAK", color: "#176b4e", accent: "#e5f0e9" },
  { id: "west-indies", name: "West Indies", shortName: "WI", color: "#71308b", accent: "#f4bd41" },
];

export interface BallEvent {
  innings: 1 | 2;
  side: Side;
  ball: number;
  overLabel: string;
  choice: string;
  runs: number;
  wicket: boolean;
  note: string;
}

export interface MatchState {
  phase: GamePhase;
  playerTeam: Team;
  opponentTeam: Team;
  oversLimit: number;
  innings: 1 | 2;
  battingSide: Side;
  tossCall: TossCall | null;
  tossWinner: Side | null;
  tossDecision: TossDecision | null;
  playerRuns: number;
  opponentRuns: number;
  playerWickets: number;
  opponentWickets: number;
  playerBallsFaced: number;
  opponentBallsFaced: number;
  target: number | null;
  history: BallEvent[];
  lastBall: BallEvent | null;
  message: string;
  result: string | null;
}

type WeightedOutcome = { runs: number; wicket: boolean; weight: number };

const shotOutcomes: Record<ShotChoice, WeightedOutcome[]> = {
  defend: [
    { runs: 0, wicket: false, weight: 38 },
    { runs: 1, wicket: false, weight: 42 },
    { runs: 2, wicket: false, weight: 10 },
    { runs: 3, wicket: false, weight: 2 },
    { runs: 4, wicket: false, weight: 2 },
    { runs: 0, wicket: true, weight: 6 },
  ],
  drive: [
    { runs: 0, wicket: false, weight: 19 },
    { runs: 1, wicket: false, weight: 30 },
    { runs: 2, wicket: false, weight: 13 },
    { runs: 3, wicket: false, weight: 2 },
    { runs: 4, wicket: false, weight: 20 },
    { runs: 6, wicket: false, weight: 6 },
    { runs: 0, wicket: true, weight: 10 },
  ],
  loft: [
    { runs: 0, wicket: false, weight: 8 },
    { runs: 1, wicket: false, weight: 14 },
    { runs: 2, wicket: false, weight: 10 },
    { runs: 3, wicket: false, weight: 2 },
    { runs: 4, wicket: false, weight: 30 },
    { runs: 6, wicket: false, weight: 20 },
    { runs: 0, wicket: true, weight: 16 },
  ],
  sweep: [
    { runs: 0, wicket: false, weight: 15 },
    { runs: 1, wicket: false, weight: 27 },
    { runs: 2, wicket: false, weight: 18 },
    { runs: 3, wicket: false, weight: 3 },
    { runs: 4, wicket: false, weight: 24 },
    { runs: 6, wicket: false, weight: 4 },
    { runs: 0, wicket: true, weight: 9 },
  ],
};

const deliveryOutcomes: Record<DeliveryChoice, WeightedOutcome[]> = {
  line: [
    { runs: 0, wicket: false, weight: 28 },
    { runs: 1, wicket: false, weight: 32 },
    { runs: 2, wicket: false, weight: 12 },
    { runs: 3, wicket: false, weight: 1 },
    { runs: 4, wicket: false, weight: 16 },
    { runs: 6, wicket: false, weight: 4 },
    { runs: 0, wicket: true, weight: 7 },
  ],
  length: [
    { runs: 0, wicket: false, weight: 17 },
    { runs: 1, wicket: false, weight: 25 },
    { runs: 2, wicket: false, weight: 12 },
    { runs: 3, wicket: false, weight: 2 },
    { runs: 4, wicket: false, weight: 22 },
    { runs: 6, wicket: false, weight: 10 },
    { runs: 0, wicket: true, weight: 12 },
  ],
  yorker: [
    { runs: 0, wicket: false, weight: 40 },
    { runs: 1, wicket: false, weight: 29 },
    { runs: 2, wicket: false, weight: 8 },
    { runs: 4, wicket: false, weight: 11 },
    { runs: 6, wicket: false, weight: 2 },
    { runs: 0, wicket: true, weight: 10 },
  ],
  bouncer: [
    { runs: 0, wicket: false, weight: 23 },
    { runs: 1, wicket: false, weight: 23 },
    { runs: 2, wicket: false, weight: 8 },
    { runs: 3, wicket: false, weight: 1 },
    { runs: 4, wicket: false, weight: 13 },
    { runs: 6, wicket: false, weight: 10 },
    { runs: 0, wicket: true, weight: 22 },
  ],
};

const teamFor = (match: MatchState, side: Side) =>
  side === "player" ? match.playerTeam : match.opponentTeam;

const otherSide = (side: Side): Side =>
  side === "player" ? "opponent" : "player";

const labelForSide = (match: MatchState, side: Side) =>
  teamFor(match, side).name;

function chooseOutcome(outcomes: WeightedOutcome[]): WeightedOutcome {
  const totalWeight = outcomes.reduce((total, outcome) => total + outcome.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const outcome of outcomes) {
    roll -= outcome.weight;
    if (roll < 0) return outcome;
  }
  return outcomes[outcomes.length - 1];
}

export function createMatch(
  playerTeamId: string,
  opponentTeamId: string,
  overs: number,
): MatchState {
  const playerTeam = TEAMS.find((team) => team.id === playerTeamId);
  const opponentTeam = TEAMS.find((team) => team.id === opponentTeamId);
  if (!playerTeam || !opponentTeam) {
    throw new Error("Choose two valid teams before starting a match.");
  }
  if (playerTeam.id === opponentTeam.id) {
    throw new Error("Choose a different opponent.");
  }
  if (![2, 5, 10].includes(overs)) {
    throw new Error("Choose a match length of 2, 5, or 10 overs.");
  }

  return {
    phase: "toss",
    playerTeam,
    opponentTeam,
    oversLimit: overs,
    innings: 1,
    battingSide: "player",
    tossCall: null,
    tossWinner: null,
    tossDecision: null,
    playerRuns: 0,
    opponentRuns: 0,
    playerWickets: 0,
    opponentWickets: 0,
    playerBallsFaced: 0,
    opponentBallsFaced: 0,
    target: null,
    history: [],
    lastBall: null,
    message: "The captains are ready. Call heads or tails.",
    result: null,
  };
}

export function callToss(match: MatchState, call: TossCall): MatchState {
  if (match.phase !== "toss") return match;

  const tossWinner: Side =
    (Math.random() < 0.5 ? "heads" : "tails") === call ? "player" : "opponent";
  if (tossWinner === "player") {
    return {
      ...match,
      phase: "toss-decision",
      tossCall: call,
      tossWinner,
      message: `${match.playerTeam.name} win the toss. Choose to bat or bowl first.`,
    };
  }

  const tossDecision: TossDecision = Math.random() < 0.52 ? "bat" : "bowl";
  return {
    ...match,
    phase: "ready",
    tossCall: call,
    tossWinner,
    tossDecision,
    message: `${match.opponentTeam.name} win the toss and choose to ${tossDecision} first.`,
  };
}

export function chooseTossDecision(
  match: MatchState,
  decision: TossDecision,
): MatchState {
  if (match.phase !== "toss-decision" || match.tossWinner !== "player") {
    return match;
  }
  return {
    ...match,
    phase: "ready",
    tossDecision: decision,
    message: `${match.playerTeam.name} choose to ${decision} first.`,
  };
}

export function startMatch(match: MatchState): MatchState {
  if (match.phase !== "ready" || !match.tossWinner || !match.tossDecision) {
    return match;
  }
  const battingSide =
    match.tossDecision === "bat" ? match.tossWinner : otherSide(match.tossWinner);
  return {
    ...match,
    phase: "playing",
    innings: 1,
    battingSide,
    message: `${labelForSide(match, battingSide)} are batting. Play the first ball.`,
  };
}

function scoreFor(match: MatchState, side: Side) {
  return side === "player" ? match.playerRuns : match.opponentRuns;
}

function wicketsFor(match: MatchState, side: Side) {
  return side === "player" ? match.playerWickets : match.opponentWickets;
}

function ballsFor(match: MatchState, side: Side) {
  return side === "player" ? match.playerBallsFaced : match.opponentBallsFaced;
}

function completeMatch(match: MatchState, chasingSideReachedTarget: boolean): MatchState {
  const playerWon = match.playerRuns > match.opponentRuns;
  const tied = match.playerRuns === match.opponentRuns;
  let result = "Match tied";
  if (!tied) {
    const winner: Side = playerWon ? "player" : "opponent";
    const margin =
      chasingSideReachedTarget
        ? `${10 - wicketsFor(match, winner)} wickets`
        : `${Math.abs(match.playerRuns - match.opponentRuns)} runs`;
    result = `${labelForSide(match, winner)} win by ${margin}`;
  }
  return {
    ...match,
    phase: "complete",
    result,
    message: result,
  };
}

function playBall(
  match: MatchState,
  choiceLabel: string,
  outcome: WeightedOutcome,
): MatchState {
  if (match.phase !== "playing") return match;

  const side = match.battingSide;
  const nextBallNumber = ballsFor(match, side) + 1;
  const overLabel = `${Math.floor(nextBallNumber / 6)}.${nextBallNumber % 6}`;
  const note = outcome.wicket
    ? "Wicket. The batter is out."
    : outcome.runs === 0
      ? "Dot ball. No run scored."
      : outcome.runs === 4
        ? "FOUR. The ball races to the boundary."
        : outcome.runs === 6
          ? "SIX. That clears the boundary."
          : `${outcome.runs} ${outcome.runs === 1 ? "run" : "runs"} added.`;
  const event: BallEvent = {
    innings: match.innings,
    side,
    ball: nextBallNumber,
    overLabel,
    choice: choiceLabel,
    runs: outcome.runs,
    wicket: outcome.wicket,
    note,
  };

  const updated: MatchState = {
    ...match,
    playerRuns:
      side === "player" ? match.playerRuns + outcome.runs : match.playerRuns,
    opponentRuns:
      side === "opponent" ? match.opponentRuns + outcome.runs : match.opponentRuns,
    playerWickets:
      side === "player" && outcome.wicket
        ? match.playerWickets + 1
        : match.playerWickets,
    opponentWickets:
      side === "opponent" && outcome.wicket
        ? match.opponentWickets + 1
        : match.opponentWickets,
    playerBallsFaced:
      side === "player" ? nextBallNumber : match.playerBallsFaced,
    opponentBallsFaced:
      side === "opponent" ? nextBallNumber : match.opponentBallsFaced,
    history: [...match.history, event],
    lastBall: event,
    message: note,
  };

  const inningsRuns = scoreFor(updated, side);
  const reachedTarget =
    updated.innings === 2 &&
    updated.target !== null &&
    inningsRuns >= updated.target;
  if (reachedTarget) return completeMatch(updated, true);

  const inningsEnded =
    ballsFor(updated, side) >= updated.oversLimit * 6 ||
    wicketsFor(updated, side) >= 10;
  if (!inningsEnded) {
    if (nextBallNumber % 6 === 0) {
      updated.message = `End of over ${nextBallNumber / 6}. ${note}`;
    }
    return updated;
  }

  if (updated.innings === 1) {
    return {
      ...updated,
      phase: "innings-break",
      message: `${labelForSide(updated, side)} finish on ${inningsRuns}. The chase is next.`,
    };
  }

  return completeMatch(updated, false);
}

export function playShot(match: MatchState, shot: ShotChoice): MatchState {
  if (match.phase !== "playing" || match.battingSide !== "player") return match;
  const labels: Record<ShotChoice, string> = {
    defend: "Defensive block",
    drive: "Front-foot drive",
    loft: "Lofted shot",
    sweep: "Sweep",
  };
  return playBall(match, labels[shot], chooseOutcome(shotOutcomes[shot]));
}

export function playDelivery(
  match: MatchState,
  delivery: DeliveryChoice,
): MatchState {
  if (match.phase !== "playing" || match.battingSide !== "opponent") return match;
  const labels: Record<DeliveryChoice, string> = {
    line: "Good line",
    length: "Hard length",
    yorker: "Yorker",
    bouncer: "Bouncer",
  };
  return playBall(match, labels[delivery], chooseOutcome(deliveryOutcomes[delivery]));
}

export function continueMatch(match: MatchState): MatchState {
  if (match.phase !== "innings-break") return match;
  const battingSide = otherSide(match.battingSide);
  const firstInningsScore = scoreFor(match, match.battingSide);
  return {
    ...match,
    phase: "playing",
    innings: 2,
    battingSide,
    target: firstInningsScore + 1,
    lastBall: null,
    message: `${labelForSide(match, battingSide)} need ${firstInningsScore + 1} to win.`,
  };
}
