import { useState } from 'react';
import { User, MessageCircle, X } from 'lucide-react';
import { CharacterConfig } from '../AICharacter';

interface BasicInfoSectionProps {
  config: CharacterConfig;
  onChange: (config: CharacterConfig) => void;
}

export function BasicInfoSection({ config, onChange }: BasicInfoSectionProps) {
  const [callWordInput, setCallWordInput] = useState('');

  const handleAddCallWord = () => {
    if (callWordInput.trim() && !config.callWords.includes(callWordInput.trim())) {
      onChange({
        ...config,
        callWords: [...config.callWords, callWordInput.trim()],
      });
      setCallWordInput('');
    }
  };

  const handleRemoveCallWord = (word: string) => {
    onChange({
      ...config,
      callWords: config.callWords.filter(w => w !== word),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCallWord();
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">기본 정보</h3>
      </div>

      {/* 캐릭터 이름 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">AI 캐릭터 이름</label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => onChange({ ...config, name: e.target.value })}
          placeholder="예: 아리, 도우미, 짝꿍"
          className="w-full bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors px-[16px] py-[8px]"
        />
      </div>

      {/* 호출어 등록 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          호출어 등록
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={callWordInput}
            onChange={(e) => setCallWordInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder='예: "AI야" "아리야" "야 거기"'
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors px-[16px] py-[8px]"
          />
          <button
            onClick={handleAddCallWord}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors px-[24px] py-[8px]"
          >추가</button>
        </div>
        
        {/* 등록된 호출어 태그 */}
        {config.callWords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {config.callWords.map((word) => (
              <div
                key={word}
                className="flex items-center gap-2 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg px-[12px] py-[5px]"
              >
                <MessageCircle className="w-3 h-3 text-blue-400" />
                <span className="text-sm text-blue-400">{word}</span>
                <button
                  onClick={() => handleRemoveCallWord(word)}
                  className="hover:bg-blue-500/30 rounded p-0.5 transition-colors"
                >
                  <X className="w-3 h-3 text-blue-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}