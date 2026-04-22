import { Mic, MicOff, Volume2, VolumeX, MessageCircle, MessageCircleOff, Zap, ZapOff } from "lucide-react";
import { useState } from "react";

export function ControlPanel() {
  const [sttActive, setSttActive] = useState(false);
  const [ttsActive, setTtsActive] = useState(true);
  const [chatActive, setChatActive] = useState(true);
  const [autoActive, setAutoActive] = useState(true);

  const controls = [
    {
      id: 'stt',
      label: '음성 인식 (STT)',
      active: sttActive,
      onToggle: () => setSttActive(!sttActive),
      activeIcon: Mic,
      inactiveIcon: MicOff,
    },
    {
      id: 'tts',
      label: '음성 출력 (TTS)',
      active: ttsActive,
      onToggle: () => setTtsActive(!ttsActive),
      activeIcon: Volume2,
      inactiveIcon: VolumeX,
    },
    {
      id: 'chat',
      label: '채팅 반응',
      active: chatActive,
      onToggle: () => setChatActive(!chatActive),
      activeIcon: MessageCircle,
      inactiveIcon: MessageCircleOff,
    },
    {
      id: 'auto',
      label: '선제 반응',
      active: autoActive,
      onToggle: () => setAutoActive(!autoActive),
      activeIcon: Zap,
      inactiveIcon: ZapOff,
    },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">빠른 제어</h3>
      <div className="grid grid-cols-2 gap-3">
        {controls.map((control) => {
          const Icon = control.active ? control.activeIcon : control.inactiveIcon;
          return (
            <button
              key={control.id}
              onClick={control.onToggle}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                control.active
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-medium">{control.label}</div>
                <div className="text-xs opacity-70">
                  {control.active ? '활성화' : '비활성화'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
