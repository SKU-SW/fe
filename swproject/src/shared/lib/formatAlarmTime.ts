/**
 * @file 알람 시각 포맷터
 * @dependsOn Intl.DateTimeFormat
 * @usedBy src/features/alarm/components/AlarmPanel.tsx
 */

const alarmTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

export function formatAlarmTime(ms: number): string {
  return alarmTimeFormatter.format(ms);
}
