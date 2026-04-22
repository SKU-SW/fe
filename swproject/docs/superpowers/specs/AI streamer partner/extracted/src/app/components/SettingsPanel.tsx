import { Slider } from "./ui/slider";

export function SettingsPanel() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">AI 반응 설정</h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-300">채팅 반응 민감도</label>
            <span className="text-xs text-blue-400 font-medium">보통</span>
          </div>
          <Slider
            defaultValue={[50]}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-500">낮음</span>
            <span className="text-xs text-slate-500">높음</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-300">선제 반응 빈도</label>
            <span className="text-xs text-blue-400 font-medium">30초</span>
          </div>
          <Slider
            defaultValue={[30]}
            max={120}
            min={10}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-500">10초</span>
            <span className="text-xs text-slate-500">120초</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-300">음성 출력 속도</label>
            <span className="text-xs text-blue-400 font-medium">1.0x</span>
          </div>
          <Slider
            defaultValue={[1.0]}
            max={2.0}
            min={0.5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-500">0.5x</span>
            <span className="text-xs text-slate-500">2.0x</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-300">음성 음량</label>
            <span className="text-xs text-blue-400 font-medium">70%</span>
          </div>
          <Slider
            defaultValue={[70]}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-500">0%</span>
            <span className="text-xs text-slate-500">100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}