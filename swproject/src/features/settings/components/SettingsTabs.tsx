/**
 * @file 설정 페이지 탭 헤더 — segmented control
 * @usedBy src/pages/SettingsPage.tsx
 */

type SettingsTabKey = "app" | "broadcast";

interface SettingsTabsProps {
  active: SettingsTabKey;
  onChange: (key: SettingsTabKey) => void;
}

const TABS: Array<{ key: SettingsTabKey; label: string }> = [
  { key: "app", label: "앱 설정" },
  { key: "broadcast", label: "방송 설정" },
];

export function SettingsTabs({ active, onChange }: SettingsTabsProps) {
  return (
    <div role="tablist" className="inline-flex rounded-lg border border-border-default bg-surface-base p-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-md px-6 py-2.5 text-sm font-bold transition-colors ${
            active === tab.key
              ? "border-brand bg-brand/10 text-brand"
              : "border-border-default text-content-secondary hover:bg-surface-hover"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
