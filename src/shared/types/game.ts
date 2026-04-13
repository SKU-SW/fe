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

export interface PlayerStats {
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  cs: number;
  gameMode: GameMode;
  elapsedSeconds: number;
}

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
