import { Bot, Mic, Volume2, Tag, CheckCircle, Box } from 'lucide-react';
import { CharacterConfig } from '../AICharacter';

interface CharacterPreviewProps {
  config: CharacterConfig;
}

export function CharacterPreview({ config }: CharacterPreviewProps) {
  // 설정에 따른 예시 대화 생성
  const getExampleDialogue = () => {
    const name = config.name || 'AI';
    
    let greeting = '';
    let response = '';
    let followUp = '';

    // 말투에 따른 대화 생성
    if (config.speechStyle === 'casual') {
      greeting = `${name}: 왔어?`;
      response = `${name}: 오 진짜? 완전 멋진데!`;
      followUp = `${name}: 나도 그렇게 생각했어 ㅋㅋ`;
    } else if (config.speechStyle === 'polite') {
      greeting = `${name}: 부르셨나요?`;
      response = `${name}: 정말 훌륭하시네요! 대단하십니다.`;
      followUp = `${name}: 계속 이렇게 해주시면 좋을 것 같아요.`;
    } else if (config.speechStyle === 'playful') {
      greeting = `${name}: 왜왜왜? 뭔데 ㅋㅋ`;
      response = `${name}: 어머 대박ㅋㅋㅋ 이게 되네?`;
      followUp = `${name}: 아니 진짜 신기한데 ㅋㅋㅋ`;
    } else {
      greeting = `${name}: 네!! 무슨 일이세요?!`;
      response = `${name}: 와!!!! 이건 진짜 레전드인데요?!?!`;
      followUp = `${name}: 저 진짜 소름 돋았어요!!!`;
    }

    // 성격에 따른 톤 조정
    if (config.personality === 'energetic') {
      greeting += ' 😊';
      response += ' ⚡';
    } else if (config.personality === 'calm') {
      // 차분한 톤 유지
    } else if (config.personality === 'humorous') {
      followUp += ' 😄';
    } else if (config.personality === 'serious') {
      followUp = `${name}: 이 부분 잘 기억해두세요.`;
    }

    return [
      { speaker: 'streamer', text: config.callWords[0] || 'AI야' },
      { speaker: 'ai', text: greeting },
      { speaker: 'streamer', text: '방금 그 플레이 봤어?' },
      { speaker: 'ai', text: response },
      { speaker: 'streamer', text: '인정?' },
      { speaker: 'ai', text: followUp },
    ];
  };

  const dialogue = getExampleDialogue();

  // 2D 모델 정보 가져오기
  const get2DModelInfo = () => {
    const presetMap: Record<string, { name: string; label: string }> = {
      'm1': { name: '민수', label: '활발' },
      'm2': { name: '지훈', label: '차분' },
      'm3': { name: '도윤', label: '다정' },
      'f1': { name: '하루', label: '발랄' },
      'f2': { name: '시아', label: '지적' },
      'f3': { name: '유나', label: '시크' },
    };
    
    if (config.model2D?.presetId && presetMap[config.model2D.presetId]) {
      return presetMap[config.model2D.presetId];
    }
    return { name: '미선택', label: '미선택' };
  };

  const modelInfo = get2DModelInfo();

  // 설정 태그 생성
  const getSettingTags = () => {
    const tags = [];

    if (config.gender === 'male') tags.push({ label: '남성', color: 'blue' });
    if (config.gender === 'female') tags.push({ label: '여성', color: 'pink' });
    
    // 2D 모델 태그
    if (modelInfo.name !== '미선택') {
      tags.push({ label: `2D: ${modelInfo.label}`, color: 'purple' });
    }

    const speechMap = {
      casual: '친근한 반말',
      polite: '존댓말',
      playful: '장난기',
      dramatic: '과장체',
    };
    tags.push({ label: speechMap[config.speechStyle], color: 'green' });

    const personalityMap = {
      energetic: '활발함',
      calm: '차분함',
      humorous: '유머러스',
      serious: '진지함',
    };
    tags.push({ label: personalityMap[config.personality], color: 'yellow' });

    return tags;
  };

  return (
    <div className="sticky top-0 p-6 h-screen flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">실시간 미리보기</h3>
        <p className="text-xs text-slate-400">설정이 즉시 반영됩니다</p>
      </div>

      {/* 캐릭터 카드 */}
      <div className="bg-slate-800 border-2 border-blue-500/50 rounded-xl p-6 mb-6">
        <div className="flex flex-col items-center text-center mb-4">
          {/* 2D 모델 미리보기 영역 */}
          <div className="w-32 h-32 bg-slate-800 border-2 border-slate-600 rounded-xl flex flex-col items-center justify-center mb-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-700/20 to-transparent"></div>
            <div className="text-4xl relative z-10 mb-1">
              {config.gender === 'male' ? '👨' : '👩'}
            </div>
            <div className="text-sm font-medium text-slate-400 relative z-10">{modelInfo.name}</div>
          </div>
          <h4 className="text-xl font-bold text-white mb-1">
            {config.name || '캐릭터 이름'}
          </h4>
          {config.callWords.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {config.callWords.slice(0, 3).map((word, idx) => (
                <span key={idx} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                  "{word}"
                </span>
              ))}
              {config.callWords.length > 3 && (
                <span className="text-xs text-slate-400">+{config.callWords.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* 프리셋 뱃지 */}
        {config.broadcastPreset && (
          <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-blue-500/10 rounded-lg">
            <Tag className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">
              {config.broadcastPreset === 'gaming' && '🎮 게임 특화'}
              {config.broadcastPreset === 'entertainment' && '🎭 유머/예능'}
              {config.broadcastPreset === 'focused' && '🎯 진중/집중'}
              {config.broadcastPreset === 'chatty' && '💬 잡담/소통'}
            </span>
          </div>
        )}
      </div>

      {/* 음성 대화 시뮬레이션 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="w-4 h-4 text-green-400" />
          <h4 className="text-sm font-semibold text-white">TTS 음성 출력 예시</h4>
        </div>
        <p className="text-xs text-slate-400 mb-3">스트리머 음성 호출 → AI 음성 응답</p>
        
        <div className="space-y-3">
          {dialogue.map((line, idx) => (
            <div
              key={idx}
              className={`flex ${line.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg ${
                  line.speaker === 'ai'
                    ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {line.speaker === 'ai' ? (
                    <Volume2 className="w-3 h-3 text-blue-400" />
                  ) : (
                    <Mic className="w-3 h-3 text-slate-400" />
                  )}
                  <div className="text-xs font-medium opacity-70">
                    {line.speaker === 'ai' ? config.name || 'AI' : '스트리머'}
                  </div>
                </div>
                <div className="text-sm">{line.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 현재 설정 요약 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <h4 className="text-sm font-semibold text-white">적용된 설정</h4>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {getSettingTags().map((tag, idx) => (
            <span
              key={idx}
              className={`text-xs px-2 py-1 rounded bg-${tag.color}-500/20 text-${tag.color}-400 border border-${tag.color}-500/30`}
            >
              {tag.label}
            </span>
          ))}
          <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
            대화 {config.conversationRounds}회
          </span>
          {config.pauseChatAnalysis && (
            <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              채팅 분석 일시 중단
            </span>
          )}
        </div>
      </div>
    </div>
  );
}