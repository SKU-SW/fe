export type Gender = 'male' | 'female';

export type SpeechStyle =
  | 'friendly_informal'
  | 'polite_formal'
  | 'playful_informal'
  | 'broadcast_exaggerated';

export type Personality = 'energetic' | 'calm' | 'humorous' | 'serious';

export type Persona =
  | 'game_specialist'
  | 'humor_entertainment'
  | 'focused_serious'
  | 'chat_social';

export type SensitivityLevel = 'high' | 'medium' | 'low';

export interface CharacterInfo {
  gender: Gender;
  name: string;
  callSign: string;
  appearancePresetId: string;
  voicePresetId: string;
  speechStyle: SpeechStyle;
  personality: Personality;
  persona: Persona;
}

export interface BroadcastSettings {
  chatSensitivity: SensitivityLevel;
  silenceIntervalSeconds: number;
  ttsSpeed: number;
  ttsVolume: number;
}

export interface CharacterPreset {
  id: string;
  name: string;
  info: CharacterInfo;
  broadcastSettings: BroadcastSettings;
  createdAt: string;
}

export interface CharacterState {
  info: CharacterInfo | null;
  broadcastSettings: BroadcastSettings | null;
  presets: CharacterPreset[];
}
