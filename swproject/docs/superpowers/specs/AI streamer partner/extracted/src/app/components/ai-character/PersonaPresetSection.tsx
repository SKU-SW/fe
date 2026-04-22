import { Zap, Info } from 'lucide-react';
import { CharacterConfig } from '../AICharacter';

interface PersonaPresetSectionProps {
  config: CharacterConfig;
  onChange: (config: CharacterConfig) => void;
}

export function PersonaPresetSection({ config, onChange }: PersonaPresetSectionProps) {
  const presets = [
    {
      id: 'friend',
      label: '동네 친구',
      icon: '🙋‍♂️',
      desc: '저스트 채팅 / 소통 특화',
      details: '가장 무난하고 편안하게 오디오를 채워주는 든든한 국밥 같은 포지션입니다.\n\n• 말투: 친근한 반말\n• 성격: 유머러스\n• 특징: 스트리머의 말에 적당한 딴지도 걸고, 밈(Meme)도 자연스럽게 소화하며 티키타카를 이어갑니다.',
      recommended: { speechStyle: 'casual' as const, personality: 'humorous' as const },
    },
    {
      id: 'high-tension',
      label: '텐션 폭발',
      icon: '🔥',
      desc: '리액션 / 하이라이트 특화',
      details: '텐션이 떨어질 때 방송 분위기를 멱살 잡고 끌어올려 주는 포지션입니다.\n\n• 말투: 방송용 과장체\n• 성격: 활발함\n• 특징: 리액션이 크고 감정 표현이 풍부합니다. 게임에서 이겼을 때 극도로 환호하거나, 엄청난 리액션을 보여줍니다.',
      recommended: { speechStyle: 'dramatic' as const, personality: 'energetic' as const },
    },
    {
      id: 'teasing',
      label: '깐족 요정',
      icon: '😈',
      desc: '게임 특화 / 훈수 및 티배깅',
      details: '시청자들을 대신해서 스트리머를 긁거나(Teasing) 팩트 폭력을 날리는 얄미운 포지션입니다.\n\n• 말투: 장난기 섞인 반말\n• 성격: 활발함 (또는 유머러스)\n• 특징: 스트리머가 게임에서 실수했을 때 놓치지 않고 놀리며 시청자들의 웃음을 유발합니다.',
      recommended: { speechStyle: 'playful' as const, personality: 'energetic' as const },
    },
    {
      id: 'manager',
      label: '전문 매니저',
      icon: '💼',
      desc: '정보 전달 / 차분한 진행',
      details: '선 넘는 채팅을 진정시키거나, 게임 스토리를 조용히 요약해 주는 비서 같은 포지션입니다.\n\n• 말투: 깍듯한 존댓말\n• 성격: 차분함\n• 특징: 흥분하지 않고 스트리머를 깍듯하게 보좌하며, 정보 전달이나 공지사항을 안내할 때 유용합니다.',
      recommended: { speechStyle: 'polite' as const, personality: 'calm' as const },
    },
    {
      id: 'immersive',
      label: '과몰입 장인',
      icon: '🎭',
      desc: '스토리 게임 / 롤플레잉 특화',
      details: '게임 속 캐릭터나 세계관에 완전히 동화되어 진지하게 상황에 임하는 포지션입니다.\n\n• 말투: 깍듯한 존댓말 (상황에 따라 진지한 반말)\n• 성격: 진지함\n• 특징: 농담보다는 상황의 심각성이나 분위기에 집중하여 몰입감을 높여줍니다.',
      recommended: { speechStyle: 'polite' as const, personality: 'serious' as const },
    },
  ] as const;

  const handlePresetSelect = (presetId: typeof presets[number]['id']) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onChange({
        ...config,
        broadcastPreset: presetId,
        speechStyle: preset.recommended.speechStyle,
        personality: preset.recommended.personality,
      });
    }
  };

  const selectedPreset = presets.find(p => p.id === config.broadcastPreset);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">페르소나 프리셋</h3>
        <span className="text-xs text-slate-400 ml-auto">선택 시 말투와 성격이 자동 추천됩니다</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetSelect(preset.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col items-start gap-2 h-full ${
              config.broadcastPreset === preset.id
                ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2 w-full">
              <span className="text-2xl">{preset.icon}</span>
              <div className="flex-1">
                <div className={`text-sm font-bold ${
                  config.broadcastPreset === preset.id ? 'text-indigo-400' : 'text-slate-200'
                }`}>
                  {preset.label}
                </div>
              </div>
            </div>
            <div className={`text-xs ${config.broadcastPreset === preset.id ? 'text-indigo-300' : 'text-slate-400'}`}>
              {preset.desc}
            </div>
          </button>
        ))}
      </div>

      {selectedPreset && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5 mt-4 flex gap-4">
          <div className="mt-1 flex-shrink-0">
            <Info className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-3 flex-1">
            <h4 className="text-sm font-bold text-indigo-300">
              {selectedPreset.label} 페르소나 적용됨
            </h4>
            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {selectedPreset.details}
            </div>
            <p className="text-xs text-indigo-400/80 pt-2 border-t border-indigo-500/20">
              이 프리셋에 맞춰 하단의 세부 말투와 성격이 자동으로 추천 설정되었습니다. 필요 시 개별 조정도 가능합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
