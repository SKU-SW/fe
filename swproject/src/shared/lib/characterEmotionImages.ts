/**
 * @file BE 의 characterImageUrl 에서 감정별 이미지 URL 매핑 생성
 * @dependsOn src/shared/types/stream.ts
 *
 * 확장자 정책: BE 가 보낸 characterImageUrl 의 확장자를 그대로 따라간다.
 *  - 예) `.../Default.webp` → 모든 감정도 `.webp`
 *  - 예) `.../Default.png`  → 모든 감정도 `.png`
 *  - 미지원/누락 시 png 폴백.
 * → 캐릭터별로 PNG/WebP 혼재해도 코드 수정 없이 동작.
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

const SUPPORTED_EXTENSIONS = new Set(["png", "webp", "jpg", "jpeg"]);
const DEFAULT_EXTENSION = "png";

/** URL 마지막 파일명에서 확장자를 추출 (쿼리스트링 제거, 소문자 정규화, 폴백 png). */
function extractExtension(url: string): string {
  const slashIdx = url.lastIndexOf("/");
  if (slashIdx < 0) return DEFAULT_EXTENSION;
  const filenameWithQuery = url.slice(slashIdx + 1);
  const queryIdx = filenameWithQuery.indexOf("?");
  const filename = queryIdx >= 0 ? filenameWithQuery.slice(0, queryIdx) : filenameWithQuery;
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx < 0) return DEFAULT_EXTENSION;
  const ext = filename.slice(dotIdx + 1).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext) ? ext : DEFAULT_EXTENSION;
}

function buildEmotionImageUrl(
  baseDir: string,
  emotion: StreamEmotion,
  ext: string,
): string {
  const baseUrl = `${baseDir}/${EMOTION_FILENAME[emotion]}.${ext}`;
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
  const ext = extractExtension(characterImageUrl);
  const map: Partial<Record<StreamEmotion, string>> = {};

  (Object.keys(EMOTION_FILENAME) as StreamEmotion[]).forEach((emotion) => {
    map[emotion] = buildEmotionImageUrl(baseDir, emotion, ext);
  });

  return map;
}

/**
 * BE 가 단일 조회 응답(`GET /characters/{id}`)에서 감정 파일명(예: Angry.png) 을 잘못 반환할 때,
 * 같은 디렉토리의 Default.{ext} 로 강제 정규화한다.
 * - 파일명이 7가지 감정 중 하나 + 지원 확장자일 때만 치환 (다른 파일명/빈 문자열은 원본 유지)
 * - 확장자는 원본 그대로 보존 (PNG/WebP 모두 지원)
 * - characterStore 에 set 되는 시점과 hydrate 시점에 호출되어, 모든 표시 화면이 일관된 Default 를 보게 함
 */
const EMOTION_FILENAME_RE =
  /\/(?:Default|Talking|Angry|Happy|Sad|Tired|Fear)(\.(?:png|webp|jpg|jpeg))$/i;

export function normalizeCharacterImageUrlToDefault(url: string | null | undefined): string {
  if (!url) return url ?? "";
  if (!EMOTION_FILENAME_RE.test(url)) return url;
  return url.replace(EMOTION_FILENAME_RE, "/Default$1");
}
