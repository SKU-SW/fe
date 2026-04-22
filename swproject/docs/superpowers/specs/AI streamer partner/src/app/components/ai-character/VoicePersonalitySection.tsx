import { MessageSquare, Sparkles } from 'lucide-react';
import { CharacterConfig } from '../AICharacter';

interface VoicePersonalitySectionProps {
  config: CharacterConfig;
  onChange: (config: CharacterConfig) => void;
}

export function VoicePersonalitySection({ config, onChange }: VoicePersonalitySectionProps) {
  const speechStyles = [
    { 
      id: 'casual', 
      label: '친근한 반말', 
      example: '오 진짜? 완전 멋진데!',
      icon: '😊'
    },
    { 
      id: 'polite', 
      label: '깍듯한 존댓말', 
      example: '정말 훌륭하시네요! 대단하십니다.',
      icon: '🙇'
    },
    { 
      id: 'playful', 
      label: '장난기 섞인 반말', 
      example: '어머 대박ㅋㅋㅋ 이게 되네?',
      icon: '😜'
    },
    { 
      id: 'dramatic', 
      label: '방송용 과장체', 
      example: '와!!!! 이건 진짜 레전드인데요?!?!',
      icon: '🎭'
    },
  ] as const;

  const personalities = [
    { 
      id: 'energetic', 
      label: '활발함', 
      example: '오 대박이다!! 진짜요?!',
      icon: '⚡',
      color: 'yellow'
    },
    { 
      id: 'calm', 
      label: '차분함', 
      example: '음.. 좋네요. 괜찮은 선택인 것 같아요.',
      icon: '🌊',
      color: 'blue'
    },
    { 
      id: 'humorous', 
      label: '유머러스', 
      example: 'ㅋㅋㅋㅋ 이건 좀 웃기는데요 ㅋㅋ',
      icon: '😄',
      color: 'green'
    },
    { 
      id: 'serious', 
      label: '진지함', 
      example: '이 부분은 신중하게 접근해야 할 것 같습니다.',
      icon: '🤔',
      color: 'purple'
    },
  ] as const;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">말투 및 성격</h3>
      </div>

      {/* 말투 선택 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          말투 선택
        </label>
        <div className="grid grid-cols-2 gap-3">
          {speechStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onChange({ ...config, speechStyle: style.id })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                config.speechStyle === style.id
                  ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{style.icon}</span>
                <span className={`text-sm font-medium ${
                  config.speechStyle === style.id ? 'text-blue-400' : 'text-slate-300'
                }`}>
                  {style.label}
                </span>
              </div>
              <div className="text-xs text-slate-400 italic">
                "{style.example}"
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 성격 선택 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          성격
        </label>
        <div className="grid grid-cols-2 gap-3">
          {personalities.map((personality) => (
            <button
              key={personality.id}
              onClick={() => onChange({ ...config, personality: personality.id })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                config.personality === personality.id
                  ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{personality.icon}</span>
                <span className={`text-sm font-medium ${
                  config.personality === personality.id ? 'text-blue-400' : 'text-slate-300'
                }`}>
                  {personality.label}
                </span>
              </div>
              <div className="text-xs text-slate-400 italic">
                "{personality.example}"
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
