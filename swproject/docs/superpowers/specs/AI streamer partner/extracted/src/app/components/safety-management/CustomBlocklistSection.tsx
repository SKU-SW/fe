import { useState } from 'react';
import { Hash, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

interface CustomBlocklistSectionProps {
  onWordCountChange: (count: number) => void;
}

interface BlockedWord {
  id: string;
  word: string;
  category: 'profanity' | 'person' | 'custom';
  scope: 'chat' | 'ai' | 'both';
}

type CategoryTab = 'all' | 'profanity' | 'person' | 'custom';

export function CustomBlocklistSection({ onWordCountChange }: CustomBlocklistSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [applyScope, setApplyScope] = useState<'chat' | 'ai' | 'both'>('both');
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([
    { id: '1', word: '욕설1', category: 'profanity', scope: 'both' },
    { id: '2', word: '욕설2', category: 'profanity', scope: 'both' },
    { id: '3', word: '욕설3', category: 'profanity', scope: 'both' },
    { id: '4', word: '특정인물A', category: 'person', scope: 'both' },
    { id: '5', word: '특정인물B', category: 'person', scope: 'both' },
    { id: '6', word: '커스텀금지어1', category: 'custom', scope: 'chat' },
    { id: '7', word: '커스텀금지어2', category: 'custom', scope: 'ai' },
  ]);

  const handleAddWord = () => {
    if (inputValue.trim()) {
      const newWord: BlockedWord = {
        id: Date.now().toString(),
        word: inputValue.trim(),
        category: 'custom',
        scope: applyScope,
      };
      const updatedWords = [...blockedWords, newWord];
      setBlockedWords(updatedWords);
      onWordCountChange(updatedWords.length);
      setInputValue('');
    }
  };

  const handleRemoveWord = (id: string) => {
    const updatedWords = blockedWords.filter(w => w.id !== id);
    setBlockedWords(updatedWords);
    onWordCountChange(updatedWords.length);
  };

  const filteredWords = activeTab === 'all' 
    ? blockedWords 
    : blockedWords.filter(w => w.category === activeTab);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'profanity': return '비속어';
      case 'person': return '특정인물';
      case 'custom': return '직접등록';
      default: return '';
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'chat': return '채팅 필터';
      case 'ai': return 'AI 필터';
      case 'both': return '둘 다';
      default: return '';
    }
  };

  const tabs: { id: CategoryTab; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'profanity', label: '비속어' },
    { id: 'person', label: '특정인물' },
    { id: 'custom', label: '직접등록' },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* 섹션 헤더 */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hash className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-white font-semibold text-lg">커스텀 금지어 관리</h3>
              <p className="text-sm text-slate-400">채팅과 AI 응답에서 차단할 단어를 직접 등록하세요</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 섹션 내용 */}
      {expanded && (
        <div className="p-6 space-y-6">
          {/* 금지어 입력 */}
          <div>
            <h4 className="text-white font-medium mb-3">금지어 추가</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                placeholder="추가할 금지어 입력..."
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleAddWord}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>
          </div>

          {/* 금지어 적용 범위 선택 */}
          <div>
            <h4 className="text-white font-medium mb-3">적용 범위</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setApplyScope('chat')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  applyScope === 'chat'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                채팅 입력 필터
              </button>
              <button
                onClick={() => setApplyScope('ai')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  applyScope === 'ai'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                AI 응답 필터
              </button>
              <button
                onClick={() => setApplyScope('both')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  applyScope === 'both'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                둘 다
              </button>
            </div>
          </div>

          {/* 카테고리 탭 */}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex gap-2 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'all' && (
                    <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                      {blockedWords.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 금지어 태그 목록 */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              {filteredWords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredWords.map((word) => (
                    <div
                      key={word.id}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg group hover:border-red-500/50 transition-colors"
                    >
                      <span className="text-white font-medium">{word.word}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          {getCategoryLabel(word.category)}
                        </span>
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                          {getScopeLabel(word.scope)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveWord(word.id)}
                        className="ml-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-500">
                  <p className="text-sm">등록된 금지어가 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* 하단 통계 */}
          <div className="pt-4 border-t border-slate-700 grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">전체</p>
              <p className="text-lg font-semibold text-white">{blockedWords.length}</p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">비속어</p>
              <p className="text-lg font-semibold text-purple-400">
                {blockedWords.filter(w => w.category === 'profanity').length}
              </p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">특정인물</p>
              <p className="text-lg font-semibold text-purple-400">
                {blockedWords.filter(w => w.category === 'person').length}
              </p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">직접등록</p>
              <p className="text-lg font-semibold text-purple-400">
                {blockedWords.filter(w => w.category === 'custom').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
