/**
 * @file 호출어(triggerWords) 정규화 및 검증 유틸
 * @usedBy src/features/character/components/CharacterForm.tsx
 * @usedBy src/features/character/components/CharacterSettings.tsx
 * @usedBy src/pages/CharacterPage.tsx
 */

const SPLIT_PATTERN = /[，,]/;

function splitLegacyCombinedWord(word: string): string[] {
  return word
    .split(SPLIT_PATTERN)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * 레거시 잘못 저장 데이터까지 고려해 호출어 배열을 정규화한다.
 * - ["강희야, 야, 친구야"] 같은 1원소 합본 배열을 분해
 * - 중복 제거
 * - 공백 제거
 */
export function normalizeTriggerWords(words?: string[] | null, fallbackCallSign?: string): string[] {
  const rawWords = words && words.length > 0
    ? words
    : fallbackCallSign
      ? splitLegacyCombinedWord(fallbackCallSign)
      : [];

  const normalized = rawWords
    .flatMap((word) => splitLegacyCombinedWord(word))
    .map((word) => word.trim())
    .filter(Boolean);

  return [...new Set(normalized)];
}

function normalizeForTriggerMatch(value: string): string {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？、]/g, "");
}

/**
 * STT 결과가 현재 호출어 중 하나를 포함하는지 검사한다.
 * - 공백/일반 문장부호 차이는 무시
 * - "형준아?", "형준 아" 같은 변형도 최대한 허용
 */
export function containsTriggerWord(text: string, words?: string[] | null): boolean {
  const normalizedWords = normalizeTriggerWords(words).map(normalizeForTriggerMatch);
  if (normalizedWords.length === 0) return true;

  const normalizedText = normalizeForTriggerMatch(text);
  if (!normalizedText) return false;

  return normalizedWords.some((word) => !!word && normalizedText.includes(word));
}

function findConflictingWord(words: string[]): string | null {
  for (let i = 0; i < words.length; i += 1) {
    for (let j = i + 1; j < words.length; j += 1) {
      if (words[i].includes(words[j]) || words[j].includes(words[i])) {
        return `${words[i]} / ${words[j]}`;
      }
    }
  }
  return null;
}

export function getTriggerWordsValidationError(words: string[]): string | null {
  if (words.length === 0) {
    return "호출어를 최소 1개 이상 등록해주세요.";
  }

  if (words.some((word) => word.length < 2)) {
    return "1글자 호출어는 허용하지 않습니다. 2글자 이상으로 등록해주세요.";
  }

  const conflict = findConflictingWord(words);
  if (conflict) {
    return `호출어끼리 포함 관계가 있습니다 (${conflict}). 더 구분되는 형태로 수정해주세요.`;
  }

  return null;
}
