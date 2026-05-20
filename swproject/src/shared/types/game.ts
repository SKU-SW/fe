export type GameMode = 'CLASSIC' | 'ARAM' | 'OTHER';

export type GameEventType =
  | 'kill'
  | 'death'
  | 'assist'
  | 'multi_kill'
  | 'objective'
  | 'victory'
  | 'defeat';

export type AIReactionSpeed = 'fast' | 'normal' | 'slow';

export interface GameEventTriggerSettings {
  kill: boolean;
  death: boolean;
  assist: boolean;
  multi_kill: boolean;
  objective: boolean;
  victory: boolean;
  defeat: boolean;
}

export interface GameSettings {
  isConnected: boolean;
  reactionSpeed: AIReactionSpeed;
  triggerSettings: GameEventTriggerSettings;
}

// ──────────────────────────────────────────────
// LoL Game Client API 타입 (127.0.0.1:2999)
// ──────────────────────────────────────────────

export interface LolPlayerScores {
  assists: number;
  creepScore: number;
  deaths: number;
  kills: number;
  wardScore: number;
}

export interface LolActivePlayer {
  summonerName: string;
  currentGold: number;
  championStats: {
    level: number;
  };
  scores: LolPlayerScores;
}

export interface LolPlayer {
  championName: string;
  isBot: boolean;
  isDead: boolean;
  summonerName: string;
  team: 'ORDER' | 'CHAOS';
  scores: LolPlayerScores;
}

export interface LolGameEvent {
  EventID: number;
  EventName: string;
  EventTime: number;
  KillerName?: string;
  VictimName?: string;
  DragonType?: string;
  Assisters?: string[];
  KillStreak?: number;
  Stolen?: string;
  TurretKilled?: string;
  InhibKilled?: string;
  Result?: string;
}

export interface LolGameStats {
  gameMode: string;
  gameTime: number;
  mapName: string;
  mapNumber: number;
  mapTerrain: string;
}

export interface LolAllGameData {
  activePlayer: LolActivePlayer;
  allPlayers: LolPlayer[];
  events: { Events: LolGameEvent[] };
  gameData: LolGameStats;
}
