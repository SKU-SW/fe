/**
 * @file 알람 메시지 카탈로그 및 포맷터
 * @dependsOn 없음
 * @usedBy src/shared/stores/alarmStore.ts
 */

export type AlarmSeverity = "info" | "warning" | "error";

export type AlarmKey =
  | "broadcast.started"
  | "broadcast.ended"
  | "broadcast.start_failed.obs"
  | "broadcast.start_failed.chzzk"
  | "obs.connected"
  | "obs.disconnected"
  | "obs.connect_failed"
  | "obs.not_found"
  | "ws.connected"
  | "ws.disconnected"
  | "ws.reconnected"
  | "ws.reconnect_failed"
  | "chzzk.linked"
  | "chzzk.unlinked"
  | "chzzk.expiring_soon"
  | "chzzk.expired"
  | "stt.start_failed"
  | "stt.permission_denied"
  | "tts.playback_failed";

export interface AlarmMessageDef {
  severity: AlarmSeverity;
  template: string;
}

export const ALARM_MESSAGES: Record<AlarmKey, AlarmMessageDef> = {
  "broadcast.started": {
    severity: "info",
    template: "방송이 시작되었습니다.",
  },
  "broadcast.ended": {
    severity: "info",
    template: "방송이 종료되었습니다.",
  },
  "broadcast.start_failed.obs": {
    severity: "error",
    template: "OBS가 준비되지 않아 방송을 시작할 수 없습니다.",
  },
  "broadcast.start_failed.chzzk": {
    severity: "error",
    template: "치지직 연동이 필요해 방송을 시작할 수 없습니다.",
  },
  "obs.connected": {
    severity: "info",
    template: "OBS와 연결되었습니다.",
  },
  "obs.disconnected": {
    severity: "warning",
    template: "OBS 연결이 끊겼습니다. 다시 연결을 시도합니다.",
  },
  "obs.connect_failed": {
    severity: "error",
    template: "OBS와 연결할 수 없습니다. OBS가 실행 중인지 확인해 주세요.",
  },
  "obs.not_found": {
    severity: "error",
    template: "OBS Studio를 찾을 수 없습니다. 설치 경로를 확인해 주세요.",
  },
  "ws.connected": {
    severity: "info",
    template: "방송 채널이 연결되었습니다.",
  },
  "ws.disconnected": {
    severity: "warning",
    template: "방송 채널 연결이 끊겼습니다. 자동으로 다시 연결합니다.",
  },
  "ws.reconnected": {
    severity: "info",
    template: "방송 채널이 다시 연결되었습니다.",
  },
  "ws.reconnect_failed": {
    severity: "error",
    template: "방송 채널에 다시 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  },
  "chzzk.linked": {
    severity: "info",
    template: "치지직 계정이 연동되었습니다.",
  },
  "chzzk.unlinked": {
    severity: "info",
    template: "치지직 연동을 해제했습니다.",
  },
  "chzzk.expiring_soon": {
    severity: "warning",
    template: "치지직 연동이 {{days}}일 후 만료됩니다. 미리 재연결해 주세요.",
  },
  "chzzk.expired": {
    severity: "error",
    template: "치지직 연동이 만료되었습니다. 다시 연결해 주세요.",
  },
  "stt.start_failed": {
    severity: "error",
    template: "마이크 인식 모듈을 시작하지 못했습니다. 앱을 재시작해 주세요.",
  },
  "stt.permission_denied": {
    severity: "error",
    template: "마이크 권한이 거부되어 음성을 인식할 수 없습니다. 시스템 설정에서 권한을 허용해 주세요.",
  },
  "tts.playback_failed": {
    severity: "warning",
    template: "AI 음성 재생에 실패했습니다.",
  },
};

export function formatAlarm(
  key: AlarmKey,
  vars?: Record<string, string | number>
): { severity: AlarmSeverity; text: string } {
  const message = ALARM_MESSAGES[key];
  const text = message.template.replace(/\{\{(.*?)\}\}/g, (match, rawName: string) => {
    const name = rawName.trim();
    if (!vars || !(name in vars)) return match;
    return String(vars[name]);
  });

  return {
    severity: message.severity,
    text,
  };
}
