import { CharacterConfig } from '../AICharacter';
import { PNGTuberSelector } from './PNGTuberSelector';
import { BasicInfoSection } from './BasicInfoSection';
import { VoicePersonalitySection } from './VoicePersonalitySection';
import { PersonaPresetSection } from './PersonaPresetSection';

interface CharacterSettingsProps {
  config: CharacterConfig;
  onChange: (config: CharacterConfig) => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export function CharacterSettings({ config, onChange, onCancel, onSave }: CharacterSettingsProps) {
  return (
    <div className="space-y-6">
      <BasicInfoSection config={config} onChange={onChange} />
      <PNGTuberSelector config={config} onChange={onChange} />
      <PersonaPresetSection config={config} onChange={onChange} />
      <VoicePersonalitySection config={config} onChange={onChange} />
      
      <div className="flex justify-end gap-3 pt-6 pb-2 border-t border-slate-700 mt-8">
        <button 
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all hover:text-white"
        >
          취소
        </button>
        <button 
          type="button"
          onClick={onSave}
          className="px-8 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25"
        >
          저장
        </button>
      </div>
    </div>
  );
}
