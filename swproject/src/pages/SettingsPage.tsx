/**
 * @file 설정 페이지 — 탭 기반 (앱 설정 / 방송 설정)
 * @usedBy src/App.tsx
 */

import { useState } from "react";
import { SettingsTabs } from "@/features/settings/components/SettingsTabs";
import { AppSettingsTab } from "@/features/settings/components/AppSettingsTab";
import { BroadcastSettingsTab } from "@/features/settings/components/BroadcastSettingsTab";

type SettingsTabKey = "app" | "broadcast";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("app");

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface-base">
      {/*  헤더 — 상단 중앙 정렬 */}
      <div className="flex w-full justify-center px-6 pt-8">
        <SettingsTabs active={activeTab} onChange={setActiveTab} />
      </div>

      {/* 본문 — 중앙 정렬, 최대 너비 제한 */}
      <div className="w-full max-w-4xl px-6 py-8">
        {activeTab === "app" ? <AppSettingsTab /> : <BroadcastSettingsTab />}
      </div>
    </div>
  );
}
