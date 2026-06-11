/**
 * electron-builder afterPack 훅: macOS 앱을 ad-hoc 서명한다.
 *
 * Developer ID/공증 없이 배포할 때, electron-builder 의 mac.identity:null 로 자체 서명은
 * 건너뛰지만 그러면 앱 번들에 유효한 서명이 없어 Apple Silicon 에서 "손상됨"으로 차단된다.
 * 여기서 ad-hoc(`-`) 서명을 강제로 입혀 유효한 번들 서명을 만든다(무료, Apple 계정 불필요).
 * → 사용자는 격리 제거 또는 우클릭→열기 만으로 실행 가능.
 *
 * afterPack 은 앱 패킹 직후·dmg 생성 전에 실행되므로, 이 서명이 dmg 산출물에 반영된다.
 */
const { execFileSync } = require("node:child_process");
const path = require("node:path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);

  console.log(`[afterPack] ad-hoc signing macOS app: ${appPath}`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], {
    stdio: "inherit",
  });
  console.log("[afterPack] ad-hoc signing done");
};
