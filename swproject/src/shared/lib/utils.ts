import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function formatKoreanDate(isoString: string): string {
  return new Date(isoString).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
  });
}

/**
 * 백엔드가 반환하는 상대 경로(/character/xxx.png)를 절대 URL로 변환
 * - 이미 http(s)로 시작하면 그대로 반환
 * - VITE_IMAGE_BASE_URL이 설정되어 있으면 그것과 결합
 * - 둘 다 아니면 빈 문자열
 */
export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (import.meta.env.VITE_IMAGE_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

/**
 * characterImageUrl 이 3D(VRM) 캐릭터의 썸네일인지 URL 패턴으로 판별.
 * 백엔드가 응답에 characterAppearanceType 을 안 주는 동안의 폴백 — 3D 캐릭터의
 * characterImageUrl 은 `.../character-3d/<gender>/vrm-xxx/thumbnail.webp` 형태로 온다.
 * (예: https://dev-img.sku-sw.cloud/character-3d/male/vrm-male-01/thumbnail.webp)
 */
export function is3DAppearanceUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\/character-3d\//i.test(url) || /\/vrm-/i.test(url);
}
