/**
 * @file 감정 이미지 7종을 백그라운드에서 미리 fetch + decode 해 브라우저 캐시에 적재.
 *       <img src> swap 시점에 네트워크 RTT/디코딩 지연이 사라져 즉시 반응함.
 * @dependsOn src/shared/types/stream.ts
 * @usedBy src/pages/DashboardPage.tsx, src/pages/OverlayPage.tsx
 */

import { useEffect } from "react";
import type { StreamEmotion } from "@/shared/types/stream";

type EmotionImageMap = Partial<Record<StreamEmotion, string>> | undefined | null;

export function useEmotionImagePreload(emotionImageMap: EmotionImageMap): void {
  const urlsKey = collectUrls(emotionImageMap).join("|");

  useEffect(() => {
    if (!urlsKey) return;
    const urls = urlsKey.split("|");
    for (const url of urls) {
      const img = new Image();
      img.src = url;
      if (typeof img.decode === "function") {
        img.decode().catch(() => {});
      }
    }
  }, [urlsKey]);
}

function collectUrls(map: EmotionImageMap): string[] {
  if (!map) return [];
  const urls: string[] = [];
  for (const url of Object.values(map)) {
    if (typeof url === "string" && url.length > 0) {
      urls.push(url);
    }
  }
  urls.sort();
  return urls;
}
