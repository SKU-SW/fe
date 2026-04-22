import { useState } from 'react';
import { Character } from '../AICharacter';
import { Plus, Edit2, Trash2, CheckCircle2, Circle, Eye, Zap } from 'lucide-react';

interface Props {
  characters: Character[];
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

export function CharacterDashboard({ characters, onCreateClick, onEditClick, onDeleteClick }: Props) {
  // 기본 선택된 캐릭터 ID를 첫 번째 항목으로 설정
  const [selectedId, setSelectedId] = useState<string>(characters[0]?.id || '');
  const [viewDetailId, setViewDetailId] = useState<string | null>(null);

  const selectedChar = characters.find(c => c.id === selectedId) || characters[0];

  const getPersonaLabel = (preset?: string, persona?: string) => {
    if (preset === 'friend') return '동네 친구 (저스트 채팅)';
    if (preset === 'high-tension') return '텐션 폭발 (리액션/하이라이트)';
    if (preset === 'teasing') return '깐족 요정 (게임 특화)';
    if (preset === 'manager') return '전문 매니저 (정보 전달)';
    if (preset === 'immersive') return '과몰입 장인 (스토리/롤플레잉)';
    if (preset === 'gaming') return '게임 특화';
    if (preset === 'entertainment') return '유머/예능';
    if (preset === 'focused') return '진중/집중';
    if (preset === 'chatty') return '잡담/소통';
    
    // Fallback based on personality if no preset
    if (persona === 'energetic') return '에너제틱';
    if (persona === 'calm') return '차분함';
    if (persona === 'humorous') return '유머러스';
    if (persona === 'serious') return '진지함';
    
    return '지정 안 됨';
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto w-full">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-1">내 AI 캐릭터</h2>
          <p className="text-sm text-slate-400">보유한 AI 동료를 확인하고 관리하세요</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* 상단: 현재 선택된 캐릭터 정보 */}
        {selectedChar && (
          <div>
            <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              현재 선택된 AI 캐릭터 정보
            </h3>
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-indigo-500/30 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-lg shadow-indigo-500/10">
              <div className="w-32 h-32 bg-slate-800 rounded-xl flex-shrink-0 border border-slate-700 overflow-hidden relative group">
                {selectedChar.imageUrl ? (
                  <img src={selectedChar.imageUrl} alt={selectedChar.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-4xl font-medium bg-slate-800">
                    {selectedChar.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-white">{selectedChar.name}</h3>
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">
                    {selectedChar.gender === 'female' ? '여성' : '남성'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium text-slate-300">페르소나:</span> 
                  {getPersonaLabel(selectedChar.broadcastPreset, selectedChar.persona)}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">호출어:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedChar.triggerWords.map((word, idx) => (
                      <span key={idx} className="px-2 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded border border-indigo-500/20">
                        "{word}"
                      </span>
                    ))}
                    {selectedChar.triggerWords.length === 0 && <span className="text-xs text-slate-500">없음</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 w-full">
                  이 캐릭터로 방송 시작
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 하단: 생성한 AI 캐릭터 목록 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-slate-200">
              생성한 AI 캐릭터 블록 ({characters.length})
            </h3>
            <button 
              onClick={onCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
            >
              <Plus className="w-4 h-4" />
              AI 캐릭터 생성하기
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {characters.map(char => {
              const isSelected = selectedId === char.id;
              
              return (
                <div 
                  key={char.id} 
                  className={`p-5 rounded-xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                    isSelected 
                      ? 'bg-slate-800/80 border-indigo-500 shadow-md' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* 정보 영역 */}
                  <div className="flex-1 w-full min-w-0 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700 flex-shrink-0">
                      {char.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-white truncate text-lg">{char.name}</div>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded border border-slate-700 flex-shrink-0">
                          {char.gender === 'female' ? '여성' : '남성'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-indigo-300 font-medium">[{getPersonaLabel(char.broadcastPreset, char.persona)}]</span>
                        <span className="text-slate-600">|</span>
                        <span>호출어: {char.triggerWords.join(', ') || '없음'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 버튼(액션) 영역 */}
                  <div className="flex items-center gap-2 w-full sm:w-auto pt-4 sm:pt-0 border-t border-slate-800 sm:border-0 mt-2 sm:mt-0">
                    <button 
                      onClick={() => setSelectedId(char.id)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected 
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      {isSelected ? '선택됨' : '선택'}
                    </button>
                    
                    <button 
                      onClick={() => setViewDetailId(viewDetailId === char.id ? null : char.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                      title="상세보기"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={() => onEditClick(char.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                      title="수정"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => {
                        if (confirm('이 캐릭터를 삭제하시겠습니까?')) {
                          onDeleteClick(char.id);
                          if (isSelected) setSelectedId(''); // 삭제된 캐릭터가 선택된 캐릭터일 경우 선택 해제
                        }
                      }}
                      className="p-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 rounded-lg border border-red-900/30 transition-colors ml-auto sm:ml-1"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {characters.length === 0 && (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <p className="text-slate-400">생성된 캐릭터가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 상세보기 모달 (간단 구현) */}
      {viewDetailId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setViewDetailId(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3">AI 캐릭터 상세 정보</h3>
            {(() => {
              const dChar = characters.find(c => c.id === viewDetailId);
              if (!dChar) return null;
              return (
                <div className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xl text-slate-400">
                      {dChar.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">{dChar.name}</div>
                      <div className="text-sm text-slate-400">{dChar.gender === 'female' ? '여성' : '남성'}</div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between border-b border-slate-700/50 pb-2">
                      <span className="text-slate-400">페르소나 프리셋</span>
                      <span className="text-slate-200 font-medium">{getPersonaLabel(dChar.broadcastPreset, dChar.persona)}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">호출어</span>
                      <span className="text-slate-200 font-medium">{dChar.triggerWords.join(', ') || '없음'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewDetailId(null)}
                    className="w-full py-2.5 mt-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                  >
                    닫기
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}