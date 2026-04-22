/**
 * @file 대시보드 메인 페이지 - 와이어프레임 기반 재작성
 * @created Sprint 2 - Dashboard Main
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy App.tsx (라우트)
 *
 * 상단 컨트롤, 상태 카드, 빠른 제어, AI 반응 설정, 채팅 모니터, AI 활동 로그
 */

import { useEffect, useRef } from 'react';
import {
  Pause,
  Play,
  Mic,
  Radio,
  Users,
  MessageSquare,
  PieChart,
  Zap,
  Settings,
  Activity,
  Clock,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import {
  useAIModeStore,
  EmotionType,
  ChatMessage,
  ActivityLog,
  PersonaSlot,
  AIMode,
  ReactionStrategy,
} from '../shared/stores/aiModeStore';

// ===== 상수 정의 =====
const EMOTION_COLOR_MAP: Record<EmotionType, string> = {
  joy: 'text-yellow-400',
  anger: 'text-red-400',
  sadness: 'text-blue-400',
  fear: 'text-purple-400',
  surprise: 'text-orange-400',
  neutral: 'text-slate-400',
};

const EMOTION_LABEL_MAP: Record<EmotionType, string> = {
  joy: '기쁨',
  anger: '분노',
  sadness: '슬픔',
  fear: '공포',
  surprise: '놀람',
  neutral: '중립',
};

const STRATEGY_LABEL_MAP: Record<ReactionStrategy, string> = {
  cheer: '응원',
  normal: '일반',
  critical: '비판',
};

const MODE_LABEL_MAP: Record<AIMode, string> = {
  broadcasting: '방송 중',
  idle: '대기',
  gaming: '게임 중',
};

export default function DashboardPage() {
  const {
    mode,
    isPaused,
    isPTTActive,
    personaSlots,
    activePersonaIndex,
    toggles,
    sensitivity,
    stats,
    chatMessages,
    activityLogs,
    reactionStrategy,
    togglePause,
    togglePTT,
    setActivePersona,
    setToggle,
    setSensitivity,
    addChatMessage,
    addActivityLog,
    clearChatMessages,
    clearActivityLogs,
  } = useAIModeStore();

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // === 헬퍼 함수 (컴포넌트 내부로 이동) ===
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getEmotionColor = (emotion: EmotionType): string => EMOTION_COLOR_MAP[emotion];

  const getEmotionLabel = (emotion: EmotionType): string => EMOTION_LABEL_MAP[emotion];

  const getStrategyLabel = (): string => STRATEGY_LABEL_MAP[reactionStrategy] || '일반';

  const getModeLabel = (): string => MODE_LABEL_MAP[mode] || '대기';

  const getDominantEmotion = (): string => {
    const ratios = stats.emotionRatios;
    let maxEmotion: EmotionType = 'neutral';
    let maxValue = 0;

    (Object.keys(ratios) as EmotionType[]).forEach((emotion) => {
      if (ratios[emotion] > maxValue) {
        maxValue = ratios[emotion];
        maxEmotion = emotion;
      }
    });

    return EMOTION_LABEL_MAP[maxEmotion];
  };

  const getTopEmotions = (): string[] => {
    const ratios = stats.emotionRatios;

    return (Object.entries(ratios) as [EmotionType, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([emotion, value]) => `${EMOTION_LABEL_MAP[emotion]}: ${value}%`);
  };

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'reaction':
        return <Zap className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'emotion':
        return <Activity className="h-4 w-4" />;
      case 'persona':
        return <Users className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getLogLevelColor = (level?: ActivityLog['level']): string => {
    switch (level) {
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  // === Mock 데이터 생성 (개발용) ===
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const mockUsernames = ['사용자1', '사용자2', '사용자3', '김철수', '박영희', '스트리밍팬', 'AI좋아요'];
    const mockMessages = [
      '안녕하세요!',
      '오늘 방송 재미있어요',
      'AI 캐릭터 너무 귀여워요',
      '이거 어떻게 해요?',
      '와우 대단하다',
      'ㅋㅋㅋㅋ',
      '감동 받았어요',
      '질문 있습니다',
      '응원합니다!',
      '화이팅!',
    ];
    const emotions: EmotionType[] = ['joy', 'anger', 'sadness', 'fear', 'surprise', 'neutral'];

    // 채팅 메시지 Mock 생성
    const chatInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * mockMessages.length);
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const newMessage: ChatMessage = {
        id: `chat-${Date.now()}-${Math.random()}`,
        username: mockUsernames[Math.floor(Math.random() * mockUsernames.length)],
        message: mockMessages[randomIndex],
        emotion: randomEmotion,
        timestamp: new Date(),
      };
      addChatMessage(newMessage);

      // 통계 업데이트
      addActivityLog({
        id: `log-${Date.now()}-${Math.random()}`,
        type: 'chat',
        message: `채팅 반응: ${newMessage.message.substring(0, 20)}...`,
        timestamp: new Date(),
        level: 'info',
      });
    }, 3000);

    // 통계 업데이트 Mock (개발 중에는 더미 데이터로 상태 확인)
    const statsInterval = setInterval(() => {
      // TODO: 백엔드 WebSocket 연동 시 실제 통계 데이터로 교체
    }, 5000);

    return () => {
      clearInterval(chatInterval);
      clearInterval(statsInterval);
    };
  }, [addChatMessage, addActivityLog]);

  // 채팅 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="space-y-6">
      {/* ========== 상단 컨트롤 ========== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">대시보드</h1>
          <p className="text-slate-400 mt-1">AI 스트리머 상태를 한눈에 확인하고 제어하세요</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 일시정지/재개 버튼 */}
          <button
            type="button"
            onClick={togglePause}
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isPaused
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? '재개' : '일시정지'}
          </button>

          {/* PTT 버튼 */}
          <button
            type="button"
            onClick={togglePTT}
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isPTTActive
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <Mic className="h-4 w-4" />
            PTT
          </button>

          {/* 방송 시작 버튼 */}
          <button
            type="button"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            방송 시작
          </button>
        </div>
      </div>

      {/* ========== 페르소나 빠른 교체 ========== */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-400" />
          페르소나 빠른 교체
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {personaSlots.map((slot: PersonaSlot, index: number) => (
            <button
              key={index}
              type="button"
              onClick={() => setActivePersona(index)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                activePersonaIndex === index
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="text-sm font-medium">{slot.name}</div>
              <div className="text-xs mt-1 opacity-75">
                {slot.id ? '활성' : '미설정'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ========== 상태 카드 그리드 ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AI 상태 */}
        <StatusCard
          title="AI 상태"
          icon={<Radio className="h-6 w-6" />}
          status={isPaused ? '일시정지' : mode === 'broadcasting' ? '방송 중' : mode === 'gaming' ? '게임 중' : '대기'}
          color={isPaused ? 'yellow' : mode === 'broadcasting' ? 'green' : mode === 'gaming' ? 'purple' : 'blue'}
          details={[
            `응답률: ${stats.aiResponseRate}%`,
            `전략: ${getStrategyLabel()}`,
          ]}
        />

        {/* 시청자 수 */}
        <StatusCard
          title="시청자 수"
          icon={<Users className="h-6 w-6" />}
          status={stats.viewerCount.toLocaleString()}
          color="blue"
          details={[
            `채팅 속도: ${stats.chatSpeed}개/분`,
            `총 채팅: ${stats.totalChats.toLocaleString()}`,
          ]}
        />

        {/* 채팅 속도 */}
        <StatusCard
          title="채팅 속도"
          icon={<MessageSquare className="h-6 w-6" />}
          status={`${stats.chatSpeed}개/분`}
          color="purple"
          details={[
            `AI 응답: ${stats.aiResponses.toLocaleString()}`,
            `반응률: ${stats.totalChats > 0 ? Math.round((stats.aiResponses / stats.totalChats) * 100) : 0}%`,
          ]}
        />

        {/* 감정 비율 */}
        <StatusCard
          title="감정 비율"
          icon={<PieChart className="h-6 w-6" />}
          status={getDominantEmotion()}
          color="orange"
          details={getTopEmotions()}
        />
      </div>

      {/* ========== 메인 콘텐츠 그리드 ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 빠른 제어 + AI 반응 설정 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 빠른 제어 */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              빠른 제어
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ToggleButton
                label="STT"
                description="음성인식"
                enabled={toggles.sttEnabled}
                onToggle={() => setToggle('sttEnabled', !toggles.sttEnabled)}
              />
              <ToggleButton
                label="TTS"
                description="음성출력"
                enabled={toggles.ttsEnabled}
                onToggle={() => setToggle('ttsEnabled', !toggles.ttsEnabled)}
              />
              <ToggleButton
                label="채팅반응"
                description="자동응답"
                enabled={toggles.chatReactionEnabled}
                onToggle={() => setToggle('chatReactionEnabled', !toggles.chatReactionEnabled)}
              />
              <ToggleButton
                label="선제반응"
                description="능동응답"
                enabled={toggles.proactiveReactionEnabled}
                onToggle={() => setToggle('proactiveReactionEnabled', !toggles.proactiveReactionEnabled)}
              />
            </div>
          </div>

          {/* AI 반응 설정 */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-400" />
              AI 반응 설정
            </h3>
            <div className="space-y-4">
              <SliderControl
                label="반응 속도"
                value={sensitivity.reactionSpeed}
                onChange={(v) => setSensitivity('reactionSpeed', v)}
              />
              <SliderControl
                label="감정 강도"
                value={sensitivity.emotionIntensity}
                onChange={(v) => setSensitivity('emotionIntensity', v)}
              />
              <SliderControl
                label="문맥 이해도"
                value={sensitivity.contextUnderstanding}
                onChange={(v) => setSensitivity('contextUnderstanding', v)}
              />
              <SliderControl
                label="창의성"
                value={sensitivity.creativity}
                onChange={(v) => setSensitivity('creativity', v)}
              />
            </div>
          </div>
        </div>

        {/* 우측: 상태 요약 */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              상태 요약
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">방송 시간</span>
                <span className="text-white font-medium">{formatDuration(stats.broadcastDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">총 채팅</span>
                <span className="text-white font-medium">{stats.totalChats.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI 응답</span>
                <span className="text-white font-medium">{stats.aiResponses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI 모드</span>
                <span className="text-white font-medium">{getModeLabel()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">반응 전략</span>
                <span className="text-white font-medium">{getStrategyLabel()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 하단: 채팅 모니터 + AI 활동 로그 ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 채팅 모니터 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-400" />
              채팅 모니터
            </h3>
            <button
              type="button"
              onClick={clearChatMessages}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              초기화
            </button>
          </div>
          <div
            ref={chatContainerRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="실시간 채팅 모니터"
            className="h-64 sm:h-80 lg:h-96 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
          >
            {chatMessages.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">아직 채팅이 없습니다</p>
              </div>
            ) : (
              chatMessages.map((msg: ChatMessage) => (
                <div key={msg.id} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-blue-400">{msg.username}</span>
                    <span className={`text-xs ${getEmotionColor(msg.emotion)}`}>
                      {getEmotionLabel(msg.emotion)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{msg.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatTime(msg.timestamp)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI 활동 로그 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              AI 활동 로그
            </h3>
            <button
              type="button"
              onClick={clearActivityLogs}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              초기화
            </button>
          </div>
          <div
            ref={logContainerRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="AI 활동 로그"
            className="h-64 sm:h-80 lg:h-96 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
          >
            {activityLogs.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">아직 활동 로그가 없습니다</p>
              </div>
            ) : (
              activityLogs.map((log: ActivityLog) => (
                <div key={log.id} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3">
                  <div className={`mt-0.5 ${getLogLevelColor(log.level)}`}>
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{log.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatTime(log.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 서브 컴포넌트 ============

interface StatusCardProps {
  title: string;
  icon: React.ReactNode;
  status: string;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'yellow';
  details: string[];
}

function StatusCard({ title, icon, status, color, details }: StatusCardProps) {
  const colorMap = {
    green: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
      statusText: 'text-green-400',
    },
    blue: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      statusText: 'text-blue-400',
    },
    purple: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      statusText: 'text-purple-400',
    },
    orange: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      statusText: 'text-orange-400',
    },
    yellow: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      statusText: 'text-yellow-400',
    },
  };

  const colors = colorMap[color];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <div className={`p-2 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
          {icon}
        </div>
      </div>
      <div className={`text-lg font-bold mb-2 ${colors.statusText}`}>{status}</div>
      <div className="space-y-1">
        {details.map((detail, idx) => (
          <p key={idx} className="text-xs text-slate-400">
            {detail}
          </p>
        ))}
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleButton({ label, description, enabled, onToggle }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-3 rounded-lg border-2 transition-all duration-200 text-center font-medium ${
        enabled
          ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/20'
          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
      }`}
      aria-pressed={enabled}
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs mt-1 opacity-75">{description}</div>
    </button>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function SliderControl({ label, value, onChange }: SliderControlProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm text-slate-400">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}
