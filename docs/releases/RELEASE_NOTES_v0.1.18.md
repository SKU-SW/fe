# Live Buddy v0.1.18

## ✨ 변경 사항

- **Windows STT 런타임 개선**
  - Windows에서 **Intel GPU 환경은 OpenVINO Whisper를 우선 사용**하도록 변경했습니다.
  - OpenVINO 경로가 불가능한 경우 **faster-whisper로 자동 fallback** 되도록 보강했습니다.
  - **NVIDIA GPU가 감지되면 CUDA faster-whisper를 우선 사용**하도록 디바이스 선택 로직을 보강했습니다.

- **데스크톱 빌드 파이프라인 정리**
  - Electron 빌드 전에 STT 사이드카와 모델을 준비하는 `stt:build` 단계를 추가했습니다.
  - Windows 전용 OpenVINO 의존성과 모델 export 스크립트를 추가했습니다.
  - GitHub Actions에서 **Windows exe / macOS dmg 릴리즈 자산을 자동 업로드**하는 워크플로를 추가했습니다.

- **랜딩 페이지 문구 수정**
  - Windows 다운로드 섹션의 안내를 `Intel/NVIDIA 지원` 기준으로 갱신했습니다.
  - 기존의 `NVIDIA GPU 필수` 문구를 제거하고 자동 전환 동작을 반영했습니다.

---

🤖 Generated with OpenCode
