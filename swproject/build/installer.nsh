; electron-builder NSIS 커스텀 훅.
;
; STT 사이드카(stt_server.exe)가 의존하는 ctranslate2 / onnxruntime 은 MSVC(Visual C++)
; 런타임 DLL 을 필요로 한다. 사용자 PC 에 그 런타임이 없으면 데몬이 'DLL load failed' 로
; 실행되지 않아 음성 인식이 동작하지 않는다(미서명 배포본 + 클린 Windows 에서 흔함).
;
; → 설치 과정에서 VC++ x64 재배포를 조용히 설치한다.
;   - 이미 같은/최신 버전이 있으면 vc_redist 가 빠르게 no-op 으로 종료한다(중복 설치 안전).
;   - per-user 설치라 vc_redist 는 필요 시 자체적으로 UAC 승격을 요청한다.
;   - vc_redist.x64.exe 는 CI 에서 build/ 로 내려받아 인스톨러에 동봉한다(BUILD_RESOURCES_DIR).

!macro customInstall
  SetOutPath "$PLUGINSDIR"
  File "${BUILD_RESOURCES_DIR}\vc_redist.x64.exe"
  DetailPrint "Visual C++ 런타임 확인/설치 중... (음성 인식 엔진 의존성)"
  ExecWait '"$PLUGINSDIR\vc_redist.x64.exe" /install /quiet /norestart' $0
  DetailPrint "Visual C++ 런타임 설치 종료 코드: $0"
!macroend
