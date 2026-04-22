import { PlusCircle, Sparkles } from 'lucide-react';

interface Props {
  onCreateClick: () => void;
}

/**
 * 캐릭터가 0개일 때 렌더링되는 Empty State 컴포넌트
 * 안내 문구와 생성 버튼을 제공합니다.
 */
export function CharacterEmptyState({ onCreateClick }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-xl">
        <Sparkles className="w-10 h-10 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">등록된 AI 캐릭터가 없습니다</h2>
      <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
        방송을 함께할 나만의 AI 동료를 만들어보세요. 
        다양한 외모와 목소리를 조합하여 개성있는 캐릭터를 생성할 수 있습니다.
      </p>
      <button 
        onClick={onCreateClick}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
      >
        <PlusCircle className="w-5 h-5" />
        AI 캐릭터 생성하기
      </button>
    </div>
  );
}