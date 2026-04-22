import { useState } from 'react';
import { CharacterConfig } from '../AICharacter';
import { PlayCircle, PauseCircle, Mic } from 'lucide-react';

interface PNGTuberSelectorProps {
  config: CharacterConfig;
  onChange: (config: CharacterConfig) => void;
}

const APPEARANCE_PRESETS = {
  male: [
    { id: 'm1', name: '민수', emoji: '👨', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'm2', name: '지훈', emoji: '🧑', color: 'bg-slate-500/20 text-slate-400' },
    { id: 'm3', name: '도윤', emoji: '👱', color: 'bg-emerald-500/20 text-emerald-400' },
    { id: 'm4', name: '건우', emoji: '👨‍🦱', color: 'bg-amber-500/20 text-amber-400' },
  ],
  female: [
    { id: 'f1', name: '하루', emoji: '👩', color: 'bg-pink-500/20 text-pink-400' },
    { id: 'f2', name: '시아', emoji: '👧', color: 'bg-purple-500/20 text-purple-400' },
    { id: 'f3', name: '유나', emoji: '👱‍♀️', color: 'bg-rose-500/20 text-rose-400' },
    { id: 'f4', name: '수진', emoji: '👩‍🦰', color: 'bg-orange-500/20 text-orange-400' },
  ]
};

const EDGE_TTS_VOICES = {
  male: [
    { id: 'ko-KR-BongJinNeural-Elder', name: '노인', desc: '지혜로운 목소리' },
    { id: 'ko-KR-BongJinNeural', name: '중년', desc: '차분한 목소리' },
    { id: 'ko-KR-InJoonNeural', name: '청년', desc: '에너제틱한 목소리' },
    { id: 'ko-KR-HyunsuNeural', name: '청소년', desc: '경쾌한 목소리' },
  ],
  female: [
    { id: 'ko-KR-SoonBokNeural', name: '노인', desc: '따뜻한 목소리' },
    { id: 'ko-KR-SeoHyeonNeural', name: '중년', desc: '차분한 목소리' },
    { id: 'ko-KR-SunHiNeural', name: '청년', desc: '밝은 목소리' },
    { id: 'ko-KR-JiMinNeural', name: '청소년', desc: '친근한 목소리' },
  ]
};

export function PNGTuberSelector({ config, onChange }: PNGTuberSelectorProps) {
  // 독립적인 UI를 위해 각각의 성별 상태를 관리합니다.
  const [appearanceGender, setAppearanceGender] = useState<'male' | 'female'>(config.gender);
  
  // config.voiceId가 없거나 현재 보이스 성별을 모를 수 있으므로 초기값 설정
  const initialVoiceGender = config.voiceId?.includes('SunHi') || config.voiceId?.includes('JiMin') || config.voiceId?.includes('SeoHyeon') || config.voiceId?.includes('SoonBok') ? 'female' : 'male';
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(initialVoiceGender);

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handleAppearanceGender = (gender: 'male' | 'female') => {
    setAppearanceGender(gender);
    // Reset preset to first one of new gender
    onChange({
      ...config,
      gender, // Base config gender typically tracks appearance
      model2D: { presetId: APPEARANCE_PRESETS[gender][0].id }
    });
  };

  const handlePresetSelect = (presetId: string) => {
    onChange({
      ...config,
      model2D: { presetId }
    });
  };

  const handleVoiceGender = (gender: 'male' | 'female') => {
    setVoiceGender(gender);
    // Reset voice to first one of new gender
    onChange({
      ...config,
      voiceId: EDGE_TTS_VOICES[gender][0].id
    });
  };

  const handleVoiceSelect = (voiceId: string) => {
    onChange({
      ...config,
      voiceId
    });
  };

  const togglePlayVoice = (voiceId: string) => {
    if (playingVoiceId === voiceId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(voiceId);
      // 오디오 재생 시뮬레이션
      setTimeout(() => {
        setPlayingVoiceId(null);
      }, 2000);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-8">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
        <h3 className="text-lg font-semibold text-white">외모 및 목소리</h3>
      </div>

      {/* 외모 설정 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-slate-300">외모</label>
          <div className="flex items-center bg-slate-900/50 p-1 rounded-lg">
            <button
              onClick={() => handleAppearanceGender('female')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                appearanceGender === 'female' 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              여성
            </button>
            <button
              onClick={() => handleAppearanceGender('male')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                appearanceGender === 'male' 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              남성
            </button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {APPEARANCE_PRESETS[appearanceGender].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className="flex flex-col items-center gap-2 group flex-shrink-0"
            >
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all ${preset.color} ${
                  config.model2D.presetId === preset.id 
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800 border-2 border-blue-400' 
                    : 'border-2 border-transparent group-hover:border-slate-600'
                }`}
              >
                {preset.emoji}
              </div>
              <span className={`text-xs font-medium ${config.model2D.presetId === preset.id ? 'text-blue-400' : 'text-slate-400'}`}>
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-700/50"></div>

      {/* 목소리 설정 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-slate-300">목소리</label>
          <div className="flex items-center bg-slate-900/50 p-1 rounded-lg">
            <button
              onClick={() => handleVoiceGender('female')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                voiceGender === 'female' 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              여성
            </button>
            <button
              onClick={() => handleVoiceGender('male')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                voiceGender === 'male' 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              남성
            </button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {EDGE_TTS_VOICES[voiceGender].map((voice) => (
            <div
              key={voice.id}
              className="flex flex-col items-center gap-2 group flex-shrink-0"
            >
              <button
                onClick={() => handleVoiceSelect(voice.id)}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all relative ${
                  config.voiceId === voice.id 
                    ? 'bg-indigo-500/20 ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-800 border-2 border-indigo-400' 
                    : 'bg-slate-700/50 border-2 border-transparent group-hover:border-slate-600'
                }`}
              >
                <div className="absolute top-0 right-0 p-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePlayVoice(voice.id); }}
                    className="bg-slate-800 rounded-full text-slate-300 hover:text-white"
                  >
                    {playingVoiceId === voice.id ? (
                      <PauseCircle className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <PlayCircle className="w-5 h-5 hover:text-indigo-400 transition-colors" />
                    )}
                  </button>
                </div>
                <Mic className={`w-6 h-6 mb-1 ${config.voiceId === voice.id ? 'text-indigo-400' : 'text-slate-400'}`} />
              </button>
              <div className="text-center">
                <div className={`text-xs font-bold ${config.voiceId === voice.id ? 'text-indigo-400' : 'text-slate-300'}`}>
                  {voice.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}