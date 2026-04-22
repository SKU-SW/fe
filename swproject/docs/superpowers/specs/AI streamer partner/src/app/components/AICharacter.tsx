import { useState, useEffect } from 'react';
import { CharacterEmptyState } from './ai-character/CharacterEmptyState';
import { CharacterDashboard } from './ai-character/CharacterDashboard';
import { CharacterForm } from './ai-character/CharacterForm';

export type Character = {
  id: string;
  name: string;
  imageUrl: string;
  gender: string;
  persona: string;
  triggerWords: string[];
  broadcastPreset?: string;
};

export function AICharacter() {
  const [characters, setCharacters] = useState<Character[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // view: 'dashboard' (리스트 또는 empty) | 'create' (생성 폼) | 'edit' (수정 폼)
  const [view, setView] = useState<'dashboard' | 'create' | 'edit'>('dashboard');
  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setCharacters(prev => prev ? prev.filter(c => c.id !== id) : []);
  };

  const handleEdit = (id: string) => {
    setEditingCharId(id);
    setView('edit');
  };

  useEffect(() => {
    // [데이터 페칭]
    // 현재 환경은 Next.js가 아닌 React(Vite) SPA이므로, TanStack Query를 도입하거나 
    // 아래와 같이 React의 useEffect와 상태 관리를 활용하여 클라이언트 사이드 페칭을 수행합니다.
    const fetchCharacters = async () => {
      setIsLoading(true);
      try {
        // API 호출을 시뮬레이션 (네트워크 지연 800ms)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 빈 배열을 반환하여 Empty State 테스트 
        // 테스트를 위해 주석을 해제하여 캐릭터 배열을 넣을 수 있습니다.
        setCharacters([]);
        
        /* 
        setCharacters([{
          id: '1',
          name: '리사 (Lisa)',
          imageUrl: '',
          gender: 'female',
          persona: 'energetic',
          triggerWords: ['리사야', '도와줘'],
        }]); 
        */

      } catch (error) {
        console.error('캐릭터 정보를 불러오는데 실패했습니다.', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  // 로딩 상태 (Skeleton UI 또는 스피너로 대체 가능)
  if (isLoading) {
    return (
      <div className="h-full bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">캐릭터 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 생성 폼 라우팅 처리
  if (view === 'create' || view === 'edit') {
    const isEdit = view === 'edit';
    const charToEdit = isEdit ? characters?.find(c => c.id === editingCharId) : undefined;
    
    return (
      <CharacterForm 
        onBack={() => setView('dashboard')} 
        onSave={(char) => {
          if (isEdit) {
            setCharacters(prev => prev ? prev.map(c => c.id === editingCharId ? char : c) : [char]);
          } else {
            setCharacters(prev => [...(prev || []), char]);
          }
          setView('dashboard');
        }} 
        initialData={charToEdit}
      />
    );
  }

  // 조건 1: 캐릭터가 0개일 때 (Empty State)
  if (!characters || characters.length === 0) {
    return <CharacterEmptyState onCreateClick={() => setView('create')} />;
  }

  // 조건 2: 캐릭터가 1개 이상일 때 (Dashboard)
  return (
    <CharacterDashboard 
      characters={characters} 
      onCreateClick={() => setView('create')} 
      onDeleteClick={handleDelete}
      onEditClick={handleEdit}
    />
  );
}
