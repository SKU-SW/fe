import { useState } from 'react';
import { CharacterSettings } from './CharacterSettings';
import { CharacterPreview } from './CharacterPreview';
import { ArrowLeft, Save } from 'lucide-react';
import { Character } from '../AICharacter';

export interface CharacterConfig {
  name: string;
  callWords: string[];
  gender: 'male' | 'female';
  voiceId?: string;
  model2D: {
    presetId: string | null;
  };
  speechStyle: 'casual' | 'polite' | 'playful' | 'dramatic';
  personality: 'energetic' | 'calm' | 'humorous' | 'serious';
  broadcastPreset: 'gaming' | 'entertainment' | 'focused' | 'chatty' | null;
  conversationRounds: number;
  autoEndConditions: {
    onStreamerSpeak: boolean;
    onTimeout: boolean;
    timeoutSeconds: number;
  };
  pauseChatAnalysis: boolean;
  ptt: {
    enabled: boolean;
    shortcutKey: string;
    mode: 'hold' | 'toggle';
    showFeedback: boolean;
  };
}

export const defaultConfig: CharacterConfig = {
  name: '',
  callWords: [],
  gender: 'female',
  voiceId: 'ko-KR-SunHiNeural',
  model2D: {
    presetId: null,
  },
  speechStyle: 'casual',
  personality: 'energetic',
  broadcastPreset: null,
  conversationRounds: 1,
  autoEndConditions: {
    onStreamerSpeak: true,
    onTimeout: true,
    timeoutSeconds: 10,
  },
  pauseChatAnalysis: true,
  ptt: {
    enabled: false,
    shortcutKey: '',
    mode: 'hold',
    showFeedback: true,
  },
};

interface Props {
  onBack: () => void;
  onSave: (char: Character) => void;
  initialData?: Character;
}

export function CharacterForm({ onBack, onSave, initialData }: Props) {
  const [config, setConfig] = useState<CharacterConfig>(() => {
    if (initialData) {
      return {
        ...defaultConfig,
        name: initialData.name,
        gender: initialData.gender as any,
        personality: initialData.persona as any,
        callWords: initialData.triggerWords,
        broadcastPreset: initialData.broadcastPreset as any || null,
      };
    }
    return defaultConfig;
  });

  const handleSave = () => {
    // Generate mock character data based on config
    const newCharacter: Character = {
      id: initialData ? initialData.id : Math.random().toString(36).substring(7),
      name: config.name || '새 AI 캐릭터',
      imageUrl: '', // We can mock an image URL if needed
      gender: config.gender,
      persona: config.personality,
      triggerWords: config.callWords.length > 0 ? config.callWords : ['야', '도와줘'],
      broadcastPreset: config.broadcastPreset || undefined,
    };
    onSave(newCharacter);
  };

  return (
    <div className="h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Top Navigation */}
      <div className="flex items-center px-8 py-4 border-b border-slate-800 bg-slate-950">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>목록으로 돌아가기</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* 좌측: 설정 영역 (2/3) */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">AI 캐릭터 설정</h2>
              <p className="text-slate-400 text-sm">방송 스타일에 맞는 AI 동료의 정체성을 디자인하세요</p>
            </div>

            <CharacterSettings 
              config={config} 
              onChange={setConfig} 
              onCancel={onBack}
              onSave={handleSave}
            />
          </div>
        </div>

        {/* 우측: 미리보기 패널 (1/3) */}
        <div className="w-[400px] border-l border-slate-700 bg-slate-900 overflow-y-auto">
          <CharacterPreview config={config} />
        </div>
      </div>
    </div>
  );
}
