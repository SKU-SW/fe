import { useState } from 'react';
import { 
  Gamepad2, 
  Zap, 
  Target,
  Skull,
  Users,
  Flame,
  Trophy,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Clock,
  TrendingUp,
  Link,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
type GameStatus = 'idle' | 'in-game';
type ReactionTone = 'excited' | 'comfort' | 'tease' | 'calm';

interface GameEvent {
  id: string;
  name: string;
  icon: typeof Target;
  enabled: boolean;
  tone: ReactionTone;
  cooldown: number;
  promptGuide: string;
}

interface EventLog {
  id: string;
  timestamp: string;
  eventType: string;
  aiResponse: string;
}

const gamePlatforms = [
  { id: 'lol', name: '리그 오브 레전드', available: true },
  { id: 'pubg', name: '배틀그라운드', available: false },
  { id: 'overwatch', name: '오버워치', available: false },
  { id: 'fifa', name: '피파', available: false },
];

const reactionTones = [
  { value: 'excited', label: '흥분/응원' },
  { value: 'comfort', label: '위로' },
  { value: 'tease', label: '놀림' },
  { value: 'calm', label: '담담하게' },
];

const mockEventLogs: EventLog[] = [
  { id: '1', timestamp: '15:23:41', eventType: '킬', aiResponse: '오! 좋아! 완벽한 타이밍이었어!' },
  { id: '2', timestamp: '15:22:15', eventType: '어시스트', aiResponse: '나이스 어시스트! 팀플이 좋네!' },
  { id: '3', timestamp: '15:20:33', eventType: '멀티킬', aiResponse: '더블킬!! 와 진짜 잘한다!' },
  { id: '4', timestamp: '15:18:47', eventType: '데스', aiResponse: '아 아쉽네.. 괜찮아, 다음 기회에 만회하자!' },
];

export function GameIntegration() {
  const [apiKey, setApiKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [gameStatus, setGameStatus] = useState<GameStatus>('in-game'); // 데모용 in-game
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([
    {
      id: 'kill',
      name: '킬',
      icon: Target,
      enabled: true,
      tone: 'excited',
      cooldown: 3,
      promptGuide: '오! 좋아! 완벽한 타이밍이었어!',
    },
    {
      id: 'death',
      name: '데스',
      icon: Skull,
      enabled: true,
      tone: 'comfort',
      cooldown: 5,
      promptGuide: '아 아쉽네.. 괜찮아, 다음 기회에 만회하자!',
    },
    {
      id: 'assist',
      name: '어시스트',
      icon: Users,
      enabled: true,
      tone: 'excited',
      cooldown: 3,
      promptGuide: '나이스 어시스트! 팀플이 좋네!',
    },
    {
      id: 'multikill',
      name: '멀티킬',
      icon: Flame,
      enabled: true,
      tone: 'excited',
      cooldown: 10,
      promptGuide: '더블킬!! 와 진짜 잘한다!',
    },
    {
      id: 'objective',
      name: '오브젝트 획득',
      icon: Trophy,
      enabled: true,
      tone: 'excited',
      cooldown: 15,
      promptGuide: '드래곤 먹었다! 이 기세로 계속 가자!',
    },
    {
      id: 'victory',
      name: '게임 승리',
      icon: ThumbsUp,
      enabled: true,
      tone: 'excited',
      cooldown: 0,
      promptGuide: '승리! 정말 수고했어! 다들 고생 많았어요!',
    },
    {
      id: 'defeat',
      name: '게임 패배',
      icon: ThumbsDown,
      enabled: true,
      tone: 'comfort',
      cooldown: 0,
      promptGuide: '아쉽지만.. 다음엔 더 잘할 수 있어. 파이팅!',
    },
  ]);

  const [gameContext, setGameContext] = useState({
    gameTerms: true,
    gameFlow: true,
    multikillSensitivity: 2, // 2=더블킬부터, 3=트리플킬부터
  });

  const handleConnectionTest = () => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1500);
  };

  const updateEventConfig = (id: string, field: keyof GameEvent, value: any) => {
    setGameEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, [field]: value } : event
      )
    );
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            연결됨
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            연결 중
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            연결 안됨
          </div>
        );
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-slate-950">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">게임 연동</h2>
        <p className="text-slate-400 text-sm">게임 이벤트 기반 AI 자동 반응 설정</p>
      </div>

      {/* 연결 상태 섹션 */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Link className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">게임 플랫폼 연결</h3>
        </div>

        {/* 플랫폼 선택 */}
        <div className="grid grid-cols-4 gap-4">
          {gamePlatforms.map((platform) => (
            <button
              key={platform.id}
              disabled={!platform.available}
              className={`p-4 rounded-lg border-2 transition-all ${
                platform.available
                  ? 'bg-blue-500/10 border-blue-500 hover:bg-blue-500/20'
                  : 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <Gamepad2 className={`w-8 h-8 mb-2 ${platform.available ? 'text-blue-400' : 'text-slate-600'}`} />
              <div className={`text-sm font-medium ${platform.available ? 'text-white' : 'text-slate-500'}`}>
                {platform.name}
              </div>
              {!platform.available && (
                <div className="text-xs text-slate-600 mt-1">준비 중</div>
              )}
            </button>
          ))}
        </div>

        {/* Riot API Key 입력 */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              Riot API Key
            </label>
            {getStatusBadge(connectionStatus)}
          </div>

          <div className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="flex-1 bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleConnectionTest}
              disabled={!apiKey || connectionStatus === 'connecting'}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors text-sm"
            >
              연결 테스트
            </button>
          </div>

          {/* 게임 감지 상태 */}
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${gameStatus === 'in-game' ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-sm text-slate-300">현재 게임 감지 상태</span>
            </div>
            <span className={`text-sm font-medium ${gameStatus === 'in-game' ? 'text-green-400' : 'text-slate-400'}`}>
              {gameStatus === 'in-game' ? '게임 진행 중' : '게임 대기 중'}
            </span>
          </div>
        </div>
      </div>

      {/* 실시간 게임 현황 패널 */}
      <div className={`bg-slate-900 border border-slate-700 rounded-xl p-6 transition-opacity ${
        gameStatus !== 'in-game' ? 'opacity-40 pointer-events-none' : ''
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">실시간 게임 현황</h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-400">챔피언</span>
              <span className="text-sm font-medium text-white">아리</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-400">게임 모드</span>
              <span className="text-sm font-medium text-white">소환사의 협곡</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-400">진행 시간</span>
              <span className="text-sm font-medium text-white">15:42</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-400">KDA</span>
              <span className="text-sm font-medium text-green-400">7 / 2 / 4</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-400">골드</span>
              <span className="text-sm font-medium text-yellow-400">8,450</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <span className="text-sm text-slate-400">CS</span>
              <span className="text-sm font-medium text-blue-400">142</span>
            </div>
          </div>
        </div>
      </div>

      {/* 이벤트 트리거 설정 섹션 */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">이벤트 트리거 설정</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {gameEvents.map((event) => {
            const Icon = event.icon;
            return (
              <div
                key={event.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4"
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-base font-semibold text-white">{event.name}</span>
                  </div>
                  <button
                    onClick={() => updateEventConfig(event.id, 'enabled', !event.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      event.enabled ? 'bg-green-600' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        event.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {event.enabled && (
                  <>
                    {/* 반응 톤 */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">반응 톤 (LLM 프롬프트)</label>
                      <select
                        value={event.tone}
                        onChange={(e) => updateEventConfig(event.id, 'tone', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {reactionTones.map((tone) => (
                          <option key={tone.value} value={tone.value}>
                            {tone.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 쿨다운 */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        쿨다운 (초)
                      </label>
                      <input
                        type="number"
                        value={event.cooldown}
                        onChange={(e) => updateEventConfig(event.id, 'cooldown', parseInt(e.target.value))}
                        min="0"
                        max="60"
                        className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* LLM 프롬프트 가이드 */}
                    <div className="pt-2 border-t border-slate-700">
                      <label className="block text-xs text-slate-400 mb-2">
                        LLM 프롬프트 가이드 (직접 수정 가능)
                      </label>
                      <textarea
                        value={event.promptGuide}
                        onChange={(e) => updateEventConfig(event.id, 'promptGuide', e.target.value)}
                        placeholder="LLM이 이 이벤트에 반응할 때 참고할 가이드를 입력하세요..."
                        rows={2}
                        className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <div className="text-xs text-slate-500 mt-1">
                        이 텍스트는 LLM에게 반응 스타일 예시로 전달됩니다
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 게임 맥락 반영 설정 */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">게임 맥락 반영 설정</h3>
        </div>

        <div className="space-y-4">
          {/* 게임 용어 인식 */}
          <label className="flex items-center justify-between p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
            <div>
              <div className="text-sm text-slate-200 mb-1">게임 용어 인식</div>
              <div className="text-xs text-slate-400">
                챔피언 이름, 아이템명 등을 자연스럽게 인식하고 반응
              </div>
            </div>
            <button
              onClick={() => setGameContext({ ...gameContext, gameTerms: !gameContext.gameTerms })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                gameContext.gameTerms ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  gameContext.gameTerms ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          {/* 게임 흐름 반영 */}
          <label className="flex items-center justify-between p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
            <div>
              <div className="text-sm text-slate-200 mb-1">게임 흐름 반영</div>
              <div className="text-xs text-slate-400">
                우세/열세 상황에 따라 다른 톤으로 반응
              </div>
            </div>
            <button
              onClick={() => setGameContext({ ...gameContext, gameFlow: !gameContext.gameFlow })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                gameContext.gameFlow ? 'bg-green-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  gameContext.gameFlow ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          {/* 멀티킬 감지 민감도 */}
          <div className="p-4 bg-slate-800 rounded-lg space-y-3">
            <div>
              <div className="text-sm text-slate-200 mb-1">멀티킬 감지 민감도</div>
              <div className="text-xs text-slate-400">
                {gameContext.multikillSensitivity === 2 ? '더블킬부터 반응' : '트리플킬부터 반응'}
              </div>
            </div>
            <input
              type="range"
              min="2"
              max="3"
              step="1"
              value={gameContext.multikillSensitivity}
              onChange={(e) => setGameContext({ ...gameContext, multikillSensitivity: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>더블킬</span>
              <span>트리플킬</span>
            </div>
          </div>
        </div>
      </div>

      {/* 이벤트 로그 */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">이벤트 로그</h3>
          <span className="text-xs text-slate-500">오늘 방송 중 감지된 이벤트</span>
        </div>

        <div className="space-y-2">
          {mockEventLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="text-xs text-slate-500 font-mono w-16 flex-shrink-0 pt-0.5">
                {log.timestamp}
              </div>
              <div className="flex-1">
                <div className="text-xs text-blue-400 mb-1">{log.eventType}</div>
                <div className="text-sm text-slate-300">{log.aiResponse}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}