/**
 * @file BE의 characterImageUrl 에서 감정별 이미지 URL 매핑 생성
 * @dependsOn src/shared/types/stream.ts
 */

import type { StreamEmotion } from "@/shared/types/stream";

const EMOTION_FILENAME: Record<StreamEmotion, string> = {
  DEFAULT: "Default",
  TALKING: "Talking",
  HAPPY: "Happy",
  ANGRY: "Angry",
  TIRED: "Tired",
  SAD: "Sad",
  FEAR: "Fear",
};

const EMOTION_CACHE_BUSTER: Partial<Record<StreamEmotion, string>> = {
  TALKING: "20260520-3",
  FEAR: "20260520-3",
};

function buildEmotionImageUrl(baseDir: string, emotion: StreamEmotion): string {
  const baseUrl = `${baseDir}/${EMOTION_FILENAME[emotion]}.png`;
  const cacheBuster = EMOTION_CACHE_BUSTER[emotion];

  return cacheBuster ? `${baseUrl}?v=${cacheBuster}` : baseUrl;
}

export function buildEmotionImageMap(
  characterImageUrl: string,
): Partial<Record<StreamEmotion, string>> {
  if (!characterImageUrl) return {};

  const slashIdx = characterImageUrl.lastIndexOf("/");
  if (slashIdx < 0) return {};

  const baseDir = characterImageUrl.slice(0, slashIdx);
  const map: Partial<Record<StreamEmotion, string>> = {};

  (Object.keys(EMOTION_FILENAME) as StreamEmotion[]).forEach((emotion) => {
    map[emotion] = buildEmotionImageUrl(baseDir, emotion);
  });

  return map;
}

/**
 * BE 가 단일 조회 응답(`GET /characters/{id}`)에서 감정 파일명(예: Angry.png) 을 잘못 반환할 때,
 * 같은 디렉토리의 Default.png 로 강제 정규화한다.
 * - 파일명이 7가지 감정 중 하나일 때만 치환 (다른 파일명/빈 문자열은 원본 유지)
 * - characterStore 에 set 되는 시점과 hydrate 시점에 호출되어, 모든 표시 화면이 일관된 Default 를 보게 함
 */
const EMOTION_FILENAME_RE = /\/(?:Default|Talking|Angry|Happy|Sad|Tired|Fear)\.png$/;

export function normalizeCharacterImageUrlToDefault(url: string | null | undefined): string {
  if (!url) return url ?? "";
  if (!EMOTION_FILENAME_RE.test(url)) return url;
  return url.replace(EMOTION_FILENAME_RE, "/Default.png");
}
