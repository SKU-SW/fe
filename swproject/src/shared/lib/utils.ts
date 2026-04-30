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
