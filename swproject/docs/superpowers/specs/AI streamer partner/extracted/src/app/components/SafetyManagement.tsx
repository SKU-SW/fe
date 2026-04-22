import { useState } from 'react';
import { SettingsSummaryBar } from './safety-management/SettingsSummaryBar';
import { AIAutoFilterSection } from './safety-management/AIAutoFilterSection';
import { CustomBlocklistSection } from './safety-management/CustomBlocklistSection';
import { AIResponseRangeSection } from './safety-management/AIResponseRangeSection';

export function SafetyManagement() {
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [blockedWordCount, setBlockedWordCount] = useState(247);

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-slate-950">
      {/* 상단 요약 바 */}
      <SettingsSummaryBar 
        blockedWordCount={blockedWordCount}
        filterEnabled={filterEnabled}
        lastUpdated="2026-04-05 14:23"
      />

      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">안전 관리 설정</h2>
        <p className="text-slate-400 text-sm">
          LLM 기반 유해성 판단 및 필터링 규칙 관리
        </p>
      </div>

      {/* AI 자동 필터링 섹션 */}
      <AIAutoFilterSection 
        enabled={filterEnabled}
        onToggle={setFilterEnabled}
      />

      {/* 커스텀 금지어 관리 섹션 */}
      <CustomBlocklistSection 
        onWordCountChange={setBlockedWordCount}
      />

      {/* AI 반응 허용 범위 설정 섹션 */}
      <AIResponseRangeSection />
    </div>
  );
}